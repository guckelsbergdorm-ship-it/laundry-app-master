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
@RequestMapping("/api/rooftop/bookings")
public class RooftopBookingController {

    private final RooftopBookingRepository bookingRepository;
    private final UserRepository userRepository;

    @GetMapping("month/{date}")
    public @ResponseBody List<RooftopBooking.Dto> getBookingsByMonth(@PathVariable LocalDate date) {
        LocalDate startDate = date.minusDays(date.getDayOfMonth() - 1);
        LocalDate endDate = startDate.plusDays(date.lengthOfMonth() - 1);

        return bookingRepository
                .findByDateBetween(startDate, endDate)
                .stream()
                .map(booking -> booking.toDto(false))
                .toList();
    }

    @GetMapping("me")
    public ResponseEntity<?> getMyBookings(
            Authentication authentication,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        User user = userRepository.findUserByRoomNumber(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(SC_NOT_FOUND).body("User not found");
        }
        return ResponseEntity.ok(
                bookingRepository.findByBookerOrderByDateDesc(user)
                        .stream()
                        .filter(booking -> (from == null || !booking.getDate().isBefore(from))
                                && (to == null || !booking.getDate().isAfter(to)))
                        .map(booking -> booking.toDto(true))
                        .toList()
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('ROOFTOP_ADMIN')")
    public ResponseEntity<?> getBookings(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) String bookerRoom
    ) {
        return ResponseEntity.ok(
                bookingRepository.search(from, to, bookerRoom)
                        .stream()
                        .map(booking -> booking.toDto(true))
                        .toList()
        );
    }

    @PreAuthorize("hasRole('ROOFTOP_ADMIN')")
    @Transactional
    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody RooftopBooking.Dto dto,
            Authentication auth
    ) {
        String roomNumber = auth.getName();
        User booker = userRepository.findUserByRoomNumber(roomNumber).orElseThrow();
        // Check that the date is not in the past
        if (dto.date().atStartOfDay().isBefore(LocalDate.now().atStartOfDay())) {
            return ResponseEntity.status(SC_BAD_REQUEST).build();
        }
        if (bookingRepository.findByDate(dto.date()).isPresent()) {
            return ResponseEntity.status(SC_BAD_REQUEST).body("A booking for this date already exists");
        }
        RooftopBooking booking = new RooftopBooking(
                null,
                booker,
                dto.date(),
                new Date(),
                dto.reason()
        );
        booking = bookingRepository.save(booking);
        return ResponseEntity.ok(booking);
    }

    @PreAuthorize("hasRole('ROOFTOP_ADMIN')")
    @Transactional
    @DeleteMapping
    public ResponseEntity<?> deleteBooking(@RequestParam Long id, Authentication auth) {
        String roomNumber = auth.getName();
        User user = userRepository.findUserByRoomNumber(roomNumber).orElse(null);
        if (user == null) {
            return ResponseEntity.status(SC_NOT_FOUND).build();
        }
        RooftopBooking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.status(SC_NOT_FOUND).build();
        }
        boolean isAdmin = user != null && (user.getRole() == User.Role.ROOFTOP_ADMIN || user.getRole() == User.Role.MASTER_ADMIN);
        if (!isAdmin && (user == null || !booking.getBooker().equals(user))) {
            return ResponseEntity.status(SC_FORBIDDEN).build();
        }
        if (booking.getDate().isBefore(LocalDate.now())) {
            return ResponseEntity.status(SC_BAD_REQUEST).build();
        }
        // Can't cancel an ongoing slot
        if (booking.getDate().equals(LocalDate.now())) {
            return ResponseEntity.status(SC_BAD_REQUEST).build();
        }
        bookingRepository.delete(booking);
        return ResponseEntity.ok().build();
    }
}
