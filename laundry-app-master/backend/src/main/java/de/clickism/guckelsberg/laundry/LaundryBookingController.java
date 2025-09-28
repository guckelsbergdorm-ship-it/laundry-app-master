package de.clickism.guckelsberg.laundry;

import de.clickism.guckelsberg.user.User;
import de.clickism.guckelsberg.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static de.clickism.guckelsberg.laundry.LaundryMachine.isValidSlotStart;
import static de.clickism.guckelsberg.laundry.LaundryUtils.formatSlot;
import static de.clickism.guckelsberg.laundry.LaundryUtils.lastSlotOfDay;
import static jakarta.servlet.http.HttpServletResponse.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/laundry/bookings")
public class LaundryBookingController {

    private final LaundryBookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final LaundryMachineRepository machineRepository;

    private final LimitsChecker limitsChecker;
    private final LaundrySlotOverrideService overrideService;

    @GetMapping("today")
    public @ResponseBody Object getBookingsAfterToday() {
        return bookingRepository.findByDateGreaterThanEqual(LocalDate.now())
                .stream()
                .map(LaundryBooking::toDto)
                .toList();
    }

    @GetMapping("future/me")
    public @ResponseBody Object getUserBookingsInTheFuture(
            Authentication auth
    ) {
        String roomNumber = auth.getName();
        User user = userRepository.findUserByRoomNumber(roomNumber).orElseThrow();
        return bookingRepository
                .findByBookerAndDateGreaterThanEqualOrderByDateAscSlotStartAsc(user, LocalDate.now())
                .stream()
                .filter(b -> !b.isInPast())
                .map(LaundryBooking::toDto)
                .toList();
    }

    @GetMapping("all/me")
    public @ResponseBody Object getAllUserBookings(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String roomNumber = auth.getName();
        User user = userRepository.findUserByRoomNumber(roomNumber).orElseThrow();
        return bookingRepository
                .findByBookerOrderByDateDescSlotStartDesc(user, PageRequest.of(page, size))
                .stream()
                .map(LaundryBooking::toDto)
                .toList();
    }

    @GetMapping("date/{date}")
    public @ResponseBody Object getBookingsByDate(
            @PathVariable LocalDate date,
            @RequestParam(defaultValue = "false") Boolean includeBuffer
    ) {
        var bookings = new ArrayList<>(bookingRepository.findByDate(date));
        if (includeBuffer) {
            bookings.addAll(bookingRepository.findByDateAndSlotStart(date.plusDays(1), 0));
            bookings.addAll(bookingRepository.findByDateAndSlotStart(date.minusDays(1), lastSlotOfDay()));
        }
        return bookings.stream()
                .map(LaundryBooking::toDto)
                .toList();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(
            @RequestBody LaundryBooking.CreateDto dto,
            Authentication auth
    ) {
        String roomNumber = auth.getName();
        User booker = userRepository.findUserByRoomNumber(roomNumber).orElseThrow();
        try {
            LaundryBooking booking = createAndValidateFromDto(dto, booker);
            booking = bookingRepository.save(booking);
            booker.setLastBookingActivity(new Date());
            userRepository.save(booker);
            return ResponseEntity.status(SC_CREATED).body(booking.toDto());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(SC_BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    @PostMapping("batch")
    @Transactional
    public ResponseEntity<?> createBatchBooking(
            @RequestBody List<LaundryBooking.CreateDto> dtos,
            Authentication auth
    ) {
        String roomNumber = auth.getName();
        User booker = userRepository.findUserByRoomNumber(roomNumber).orElseThrow();
        try {
            for (LaundryBooking.CreateDto dto : dtos) {
                LaundryBooking booking = createAndValidateFromDto(dto, booker);
                bookingRepository.save(booking);
            }
        } catch (IllegalArgumentException e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            return ResponseEntity.status(SC_BAD_REQUEST)
                    .body(e.getMessage());
        }
        booker.setLastBookingActivity(new Date());
        userRepository.save(booker);
        return ResponseEntity.status(SC_CREATED).build();
    }

    private LaundryBooking createAndValidateFromDto(LaundryBooking.CreateDto dto, User booker)
            throws IllegalArgumentException {
        LaundryMachine machine = machineRepository.findById(dto.machineName()).orElseThrow();
        LaundryBooking booking = new LaundryBooking(null, booker, machine, dto.date(), new Date(), dto.slotStart());
        validateBooking(booking);
        return booking;
    }

    private void validateBooking(LaundryBooking booking)
            throws IllegalArgumentException {
        List<LaundrySlotOverride> overrides = overrideService.findActiveOverrides(booking.getMachine(), booking.getDate());
        boolean slotExtended = overrides.stream()
                .filter(override -> override.getStatus() == LaundrySlotOverride.Status.EXTENDED)
                .anyMatch(override -> override.appliesTo(booking.getSlotStart()));
        if (!isValidSlotStart(booking.getSlotStart()) && !slotExtended) {
            throw new IllegalArgumentException("Invalid slot start " + formatSlot(booking.getSlotStart())
                                               + " for machine " + booking.getMachine().getName());
        }
        if (booking.isInPast()) {
            throw new IllegalArgumentException("Cannot book a slot in the past: "
                                               + formatSlot(booking.getSlotStart(), booking.getDate()));
        }
        boolean slotBlocked = overrides.stream()
                .filter(override -> override.getStatus() == LaundrySlotOverride.Status.BLOCKED)
                .anyMatch(override -> override.appliesTo(booking.getSlotStart()));
        if (slotBlocked) {
            throw new IllegalArgumentException("The selected time slot "
                                               + formatSlot(booking.getSlotStart(), booking.getDate())
                                               + " for machine " + booking.getMachine().getName()
                                               + " is blocked.");
        }
        validateBookingDoesNotOverlap(booking);
        limitsChecker.checkLimits(booking);
    }

    private void validateBookingDoesNotOverlap(LaundryBooking booking)
            throws IllegalArgumentException {
        Optional<LaundryBooking> overlappingBooking = bookingRepository
                .findByMachineAndDateBetween(
                        booking.getMachine(),
                        booking.getDate().minusDays(1),
                        booking.getDate().plusDays(1)
                )
                .stream()
                .filter(booking::isOverlapping)
                .findAny();
        if (overlappingBooking.isPresent()) {
            throw new IllegalArgumentException("The selected time slot "
                                               + formatSlot(booking.getSlotStart(), booking.getDate())
                                               + " for machine " + booking.getMachine().getName()
                                               + " is already booked or is overlapping with another slot.");
        }
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<?> deleteBooking(@RequestParam Long id, Authentication auth) {
        String roomNumber = auth.getName();
        User user = userRepository.findUserByRoomNumber(roomNumber).orElse(null);
        LaundryBooking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.status(SC_NOT_FOUND).build();
        }
        if (!booking.getBooker().equals(user)) {
            return ResponseEntity.status(SC_FORBIDDEN).build();
        }
        if (booking.isInPast() || booking.isOngoing()) {
            return ResponseEntity.status(SC_BAD_REQUEST).build();
        }
        bookingRepository.delete(booking);
        return ResponseEntity.ok().build();
    }
}
