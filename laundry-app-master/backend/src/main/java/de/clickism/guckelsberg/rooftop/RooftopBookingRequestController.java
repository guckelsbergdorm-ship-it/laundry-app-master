package de.clickism.guckelsberg.rooftop;

import de.clickism.guckelsberg.user.User;
import de.clickism.guckelsberg.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

import static jakarta.servlet.http.HttpServletResponse.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/rooftop/bookings/requests")
public class RooftopBookingRequestController {
    private final RooftopBookingRequestRepository requestRepository;
    private final RooftopBookingRepository rooftopBookingRepository;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getUserRequests(
            Authentication auth,
            @RequestParam(required = false) RooftopBookingRequest.Status status,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        User booker = userRepository.findUserByRoomNumber(auth.getName()).orElse(null);
        if (booker == null) {
            return ResponseEntity.status(SC_NOT_FOUND).body("User not found");
        }
        return ResponseEntity.ok(
                requestRepository
                        .search(booker, status, from, to)
                        .stream()
                        .map(RooftopBookingRequest::toDto)
                        .toList());
    }

    @PreAuthorize("hasRole('ROOFTOP_ADMIN')")
    @GetMapping
    public @ResponseBody List<RooftopBookingRequest.Dto> getAllRequests(
            @RequestParam(required = false) String bookerRoom,
            @RequestParam(required = false) RooftopBookingRequest.Status status,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        User booker = null;
        if (bookerRoom != null && !bookerRoom.isBlank()) {
            booker = userRepository.findUserByRoomNumber(bookerRoom).orElse(null);
            if (booker == null) {
                return List.of();
            }
        }
        return requestRepository
                .search(booker, status, from, to)
                .stream()
                .map(RooftopBookingRequest::toDto)
                .toList();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createRequest(@RequestBody RooftopBookingRequest.Dto dto, Authentication auth) {
        User booker = userRepository.findUserByRoomNumber(auth.getName()).orElse(null);
        if (booker == null) {
            return ResponseEntity.status(SC_NOT_FOUND).body("User not found");
        }
        // Check that the date is not in the past
        if (dto.date().atStartOfDay().isBefore(LocalDate.now().atStartOfDay())) {
            return ResponseEntity.status(SC_BAD_REQUEST).build();
        }
        if (requestRepository.findByDateAndBooker(dto.date(), booker)
                .filter(existing -> existing.getStatus() != RooftopBookingRequest.Status.CANCELLED
                        && existing.getStatus() != RooftopBookingRequest.Status.REJECTED)
                .isPresent()) {
            return ResponseEntity.status(SC_CONFLICT).body("You already have a request for this date");
        }
        if (rooftopBookingRepository.findByDate(dto.date()).isPresent()) {
            return ResponseEntity.badRequest().body("A booking for this date already exists");
        }
        RooftopBookingRequest request = new RooftopBookingRequest();
        request.setBooker(booker);
        request.setDate(dto.date());
        request.setCreatedAt(new Date());
        request.setReason(dto.reason());
        request.setContact(dto.contact());
        request.setTimeSpan(dto.timeSpan());
        requestRepository.save(request);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ROOFTOP_ADMIN')")
    @PostMapping("{id}/approve")
    @Transactional
    public ResponseEntity<?> approveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) DecisionDto body,
            Authentication auth
    ) {
        RooftopBookingRequest request = requestRepository.findById(id).orElse(null);
        if (request == null) {
            return ResponseEntity.status(SC_NOT_FOUND).body("Request not found");
        }
        if (request.getStatus() != RooftopBookingRequest.Status.REQUESTED) {
            return ResponseEntity.status(SC_BAD_REQUEST).body("Request is not pending");
        }
        if (rooftopBookingRepository.findByDate(request.getDate()).isPresent()) {
            return ResponseEntity.badRequest().body("A booking for this date already exists");
        }
        User approver = userRepository.findUserByRoomNumber(auth.getName()).orElse(null);
        if (approver == null) {
            return ResponseEntity.badRequest().body("Approver not found");
        }
        request.approve(approver, body != null ? body.reason() : null);
        requestRepository.save(request);
        RooftopBooking booking = new RooftopBooking(
                null,
                request.getBooker(),
                request.getDate(),
                new Date(),
                request.getReason()
        );
        rooftopBookingRepository.save(booking);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ROOFTOP_ADMIN')")
    @PostMapping("{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) DecisionDto body,
            Authentication authentication
    ) {
        RooftopBookingRequest request = requestRepository.findById(id).orElse(null);
        if (request == null) {
            return ResponseEntity.status(SC_NOT_FOUND).body("Request not found");
        }
        if (request.getStatus() != RooftopBookingRequest.Status.REQUESTED) {
            return ResponseEntity.status(SC_BAD_REQUEST).body("Request is not pending");
        }
        User reviewer = userRepository.findUserByRoomNumber(authentication.getName()).orElse(null);
        if (reviewer == null) {
            return ResponseEntity.status(SC_BAD_REQUEST).body("Reviewer not found");
        }
        String reason = body != null ? body.reason() : null;
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.status(SC_BAD_REQUEST).body("Rejection reason is required");
        }
        request.reject(reviewer, reason);
        requestRepository.save(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("{id}/cancel")
    @Transactional
    public ResponseEntity<?> cancelRequest(@PathVariable Long id, Authentication authentication) {
        RooftopBookingRequest request = requestRepository.findById(id).orElse(null);
        if (request == null) {
            return ResponseEntity.status(SC_NOT_FOUND).body("Request not found");
        }
        User requester = userRepository.findUserByRoomNumber(authentication.getName()).orElse(null);
        if (requester == null || !request.getBooker().equals(requester)) {
            return ResponseEntity.status(SC_FORBIDDEN).build();
        }
        if (request.getStatus() != RooftopBookingRequest.Status.REQUESTED) {
            return ResponseEntity.status(SC_BAD_REQUEST).body("Only pending requests can be cancelled");
        }
        if (request.getDate().isBefore(LocalDate.now())) {
            return ResponseEntity.status(SC_BAD_REQUEST).body("Cannot cancel past requests");
        }
        request.cancel();
        requestRepository.save(request);
        return ResponseEntity.ok().build();
    }

    public record DecisionDto(String reason) {}
}
