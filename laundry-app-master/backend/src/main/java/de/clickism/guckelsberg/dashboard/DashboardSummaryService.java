package de.clickism.guckelsberg.dashboard;

import de.clickism.guckelsberg.dashboard.DashboardSummaryDto.AdminSummaryDto;
import de.clickism.guckelsberg.dashboard.DashboardSummaryDto.LaundrySummaryDto;
import de.clickism.guckelsberg.dashboard.DashboardSummaryDto.LaundrySummaryDto.NextLaundryBookingDto;
import de.clickism.guckelsberg.dashboard.DashboardSummaryDto.LaundrySummaryDto.QuotaDto;
import de.clickism.guckelsberg.dashboard.DashboardSummaryDto.RooftopSummaryDto;
import de.clickism.guckelsberg.dashboard.DashboardSummaryDto.RooftopSummaryDto.NextRooftopBookingDto;
import de.clickism.guckelsberg.laundry.LaundryBooking;
import de.clickism.guckelsberg.laundry.LaundryBookingRepository;
import de.clickism.guckelsberg.laundry.LaundryMachine;
import de.clickism.guckelsberg.laundry.LimitsChecker;
import de.clickism.guckelsberg.rooftop.RooftopBooking;
import de.clickism.guckelsberg.rooftop.RooftopBookingRepository;
import de.clickism.guckelsberg.rooftop.RooftopBookingRequest;
import de.clickism.guckelsberg.rooftop.RooftopBookingRequestRepository;
import de.clickism.guckelsberg.user.User;
import de.clickism.guckelsberg.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DashboardSummaryService {

    private final UserRepository userRepository;
    private final LaundryBookingRepository laundryBookingRepository;
    private final RooftopBookingRepository rooftopBookingRepository;
    private final RooftopBookingRequestRepository requestRepository;

    public DashboardSummaryDto buildSummary(String roomNumber) {
        User user = userRepository.findUserByRoomNumber(roomNumber)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        LaundrySummaryDto laundrySummary = buildLaundrySummary(user, today, weekStart, weekEnd);
        RooftopSummaryDto rooftopSummary = buildRooftopSummary(user, today);
        AdminSummaryDto adminSummary = buildAdminSummary(user, today);

        return new DashboardSummaryDto(laundrySummary, rooftopSummary, adminSummary);
    }

    private LaundrySummaryDto buildLaundrySummary(User user, LocalDate today, LocalDate weekStart, LocalDate weekEnd) {
        List<LaundryBooking> upcomingBookings = laundryBookingRepository
                .findByBookerAndDateGreaterThanEqualOrderByDateAscSlotStartAsc(user, today)
                .stream()
                .filter(booking -> !booking.isInPast())
                .toList();

        LaundryBooking nextBooking = upcomingBookings.stream()
                .min(Comparator.comparing(LaundryBooking::getDate)
                        .thenComparing(LaundryBooking::getSlotStart))
                .orElse(null);

        long washerUsed = laundryBookingRepository
                .findByBookerAndDateBetweenAndMachine_Type(user, weekStart, weekEnd, LaundryMachine.MachineType.WASHER)
                .stream()
                .mapToLong(b -> Optional.ofNullable(b.getMachine().getSlotDuration()).orElse(LaundryMachine.BASE_SLOT_DURATION))
                .sum();
        long washerQuota = Optional.ofNullable(user.getMaxWasherMinutesPerWeek())
                .orElse(LimitsChecker.DEFAULT_MAX_WASHER_MINUTES_PER_USER_PER_WEEK);

        long dryerUsed = laundryBookingRepository
                .findByBookerAndDateBetweenAndMachine_Type(user, weekStart, weekEnd, LaundryMachine.MachineType.DRYER)
                .stream()
                .mapToLong(b -> Optional.ofNullable(b.getMachine().getSlotDuration()).orElse(LaundryMachine.BASE_SLOT_DURATION))
                .sum();
        long dryerQuota = Optional.ofNullable(user.getMaxDryerMinutesPerWeek())
                .orElse(LimitsChecker.DEFAULT_MAX_DRYER_MINUTES_PER_USER_PER_WEEK);

        long upcomingCount = upcomingBookings.stream()
                .filter(booking -> !booking.getDate().isAfter(today.plusDays(7)))
                .count();

        NextLaundryBookingDto next = null;
        if (nextBooking != null) {
            LocalDateTime start = nextBooking.getSlotStartTime();
            next = new NextLaundryBookingDto(
                    nextBooking.getMachine().getName(),
                    nextBooking.getDate(),
                    nextBooking.getSlotStart(),
                    start
            );
        }

        return new LaundrySummaryDto(
                next,
                new QuotaDto(washerUsed, washerQuota),
                new QuotaDto(dryerUsed, dryerQuota),
                upcomingCount
        );
    }

    private RooftopSummaryDto buildRooftopSummary(User user, LocalDate today) {
        RooftopBooking nextBooking = rooftopBookingRepository.findByBookerOrderByDateDesc(user)
                .stream()
                .filter(booking -> !booking.getDate().isBefore(today))
                .min(Comparator.comparing(RooftopBooking::getDate))
                .orElse(null);

        long pendingRequests = requestRepository.search(user, RooftopBookingRequest.Status.REQUESTED, today, null)
                .size();

        NextRooftopBookingDto next = null;
        if (nextBooking != null) {
            next = new NextRooftopBookingDto(
                    nextBooking.getDate(),
                    nextBooking.getReason()
            );
        }

        return new RooftopSummaryDto(next, pendingRequests);
    }

    private AdminSummaryDto buildAdminSummary(User user, LocalDate today) {
        boolean isLaundryAdmin = user.getRole() == User.Role.LAUNDRY_ADMIN || user.getRole() == User.Role.MASTER_ADMIN;
        boolean isRooftopAdmin = user.getRole() == User.Role.ROOFTOP_ADMIN || user.getRole() == User.Role.MASTER_ADMIN;

        Long pendingRequests = null;
        if (isRooftopAdmin) {
            pendingRequests = (long) requestRepository.search(null, RooftopBookingRequest.Status.REQUESTED, today, null).size();
        }

        Long todaysLaundryBookings = null;
        if (isLaundryAdmin) {
            todaysLaundryBookings = (long) laundryBookingRepository.findByDate(today).size();
        }

        Long upcomingEvents = null;
        if (isRooftopAdmin) {
            upcomingEvents = (long) rooftopBookingRepository.findByDateBetween(today, today.plusDays(7)).size();
        }

        if (pendingRequests == null && todaysLaundryBookings == null && upcomingEvents == null) {
            return null;
        }

        return new AdminSummaryDto(pendingRequests, todaysLaundryBookings, upcomingEvents);
    }
}