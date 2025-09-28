package de.clickism.guckelsberg.dashboard;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DashboardSummaryDto(
        LaundrySummaryDto laundry,
        RooftopSummaryDto rooftop,
        AdminSummaryDto admin
) {

    public record LaundrySummaryDto(
            NextLaundryBookingDto nextBooking,
            QuotaDto washerQuota,
            QuotaDto dryerQuota,
            long upcomingBookingsWithinWeek
    ) {
        public record NextLaundryBookingDto(
                String machineName,
                LocalDate date,
                Integer slotStart,
                LocalDateTime slotStartDateTime
        ) {
        }

        public record QuotaDto(long usedMinutes, long maxMinutes) {
        }
    }

    public record RooftopSummaryDto(
            NextRooftopBookingDto nextBooking,
            long pendingRequests
    ) {
        public record NextRooftopBookingDto(
                LocalDate date,
                String reason
        ) {
        }
    }

    public record AdminSummaryDto(
            Long pendingRooftopRequests,
            Long todaysLaundryBookings,
            Long upcomingRooftopEvents
    ) {
    }
}