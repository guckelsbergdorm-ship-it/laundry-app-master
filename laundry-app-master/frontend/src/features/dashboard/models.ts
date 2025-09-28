export type DashboardSummary = {
  laundry: {
    nextBooking: {
      machineName: string;
      date: string;
      slotStart: number;
      slotStartDateTime: string;
    } | null;
    washerQuota: Quota;
    dryerQuota: Quota;
    upcomingBookingsWithinWeek: number;
  };
  rooftop: {
    nextBooking: {
      date: string;
      reason: string | null;
    } | null;
    pendingRequests: number;
  };
  admin: {
    pendingRooftopRequests: number | null;
    todaysLaundryBookings: number | null;
    upcomingRooftopEvents: number | null;
  } | null;
};

export type Quota = {
  usedMinutes: number;
  maxMinutes: number;
};