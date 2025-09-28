package de.clickism.guckelsberg.laundry;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Date;
import java.util.Optional;

@AllArgsConstructor
@Component
public class LimitsChecker {
    public static final long DEFAULT_MAX_WASHER_MINUTES_PER_USER_PER_WEEK = 9 * 60; // 6 slots
    public static final long DEFAULT_MAX_DRYER_MINUTES_PER_USER_PER_WEEK = 18 * 60; // 6 slots
    public static final int MAX_BOOKING_DAYS_AHEAD = 7; // 1 week
    public static final int BOOKING_COOLDOWN_SECONDS = 15;

    private final LaundryBookingRepository bookingRepository;

    /**
     * Checks booking limits for the given user and booking dto.
     *
     * @throws IllegalArgumentException if any limit is violated
     */
    public void checkLimits(LaundryBooking booking) throws IllegalArgumentException {
        checkCooldown(booking);
        checkBookingDate(booking);
        checkHoursPerWeek(booking);
    }

    private void checkCooldown(LaundryBooking booking) {
        Date lastBookingActivity = booking.getBooker().getLastBookingActivity();
        if (lastBookingActivity == null) return;
        long secondsSinceLastBooking = (new Date().getTime() - lastBookingActivity.getTime()) / 1000;
        if (secondsSinceLastBooking < BOOKING_COOLDOWN_SECONDS) {
            throw new IllegalArgumentException(
                    "You can only make a booking every " + BOOKING_COOLDOWN_SECONDS + " seconds. " +
                    "Please try again in " + (BOOKING_COOLDOWN_SECONDS - secondsSinceLastBooking) + " seconds.");
        }
    }

    private void checkBookingDate(LaundryBooking booking) {
        LocalDate today = LocalDate.now();
        if (booking.getDate().isAfter(today.plusDays(MAX_BOOKING_DAYS_AHEAD))) {
            throw new IllegalArgumentException("Can't book more than " + MAX_BOOKING_DAYS_AHEAD + " days in advance.");
        }
    }

    private void checkHoursPerWeek(LaundryBooking booking) {
        LaundryMachine.MachineType type = booking.getMachine().getType();
        int bookedMinutes = getHoursBookedInWeek(booking, type);
        double bookedHours = (double) bookedMinutes / 60;
        String errorMessage = """
                You are not allowed to book %s for more than %s hours per week.
                You already booked %s hours so far this week. -
                If you consistently need more slots, please contact the administrators.
                """.replace('\n', ' ').trim();
        switch (type) {
            case WASHER -> {
                long maxMinutes = Optional.ofNullable(booking.getBooker().getMaxWasherMinutesPerWeek())
                        .orElse(DEFAULT_MAX_WASHER_MINUTES_PER_USER_PER_WEEK);
                if (bookedMinutes + booking.getMachine().getSlotDuration() > maxMinutes) {
                    throw new IllegalArgumentException(
                            errorMessage.formatted("washers", ((double) maxMinutes / 60), bookedHours));
                }
            }
            case DRYER -> {
                long maxMinutes = Optional.ofNullable(booking.getBooker().getMaxDryerMinutesPerWeek())
                        .orElse(DEFAULT_MAX_DRYER_MINUTES_PER_USER_PER_WEEK);
                if (bookedMinutes + booking.getMachine().getSlotDuration()
                    > maxMinutes) {
                    throw new IllegalArgumentException(
                            errorMessage.formatted("dryers", ((double) maxMinutes / 60), bookedHours));
                }
            }
        }

    }

    private int getHoursBookedInWeek(LaundryBooking booking, LaundryMachine.MachineType type) {
        LocalDate weekStart = booking.getDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = booking.getDate().with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        return bookingRepository
                .findByBookerAndDateBetweenAndMachine_Type(booking.getBooker(), weekStart, weekEnd, type)
                .stream()
                .mapToInt(b -> b.getMachine().getSlotDuration())
                .sum();
    }
}
