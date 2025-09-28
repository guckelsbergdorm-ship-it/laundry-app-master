import Layout from "../components/layout/Layout.tsx";
import {useDashboardSummary} from "../features/dashboard/queries.ts";
import {useUserData} from "../features/user/queries.ts";
import {Loading} from "../components/Loading.tsx";
import styles from "../features/dashboard/Dashboard.module.css";
import {formatDateRelativeToToday} from "../utils.ts";

const minutesToHours = (minutes: number) => (minutes / 60).toFixed(1);

export default function HomePage() {
  const {data: user, isLoading: userLoading, isError: userError} = useUserData();
  const {data: summary, isLoading, isError} = useDashboardSummary(!userError && !!user);

  if (userLoading || (user && isLoading)) {
    return (
      <Layout>
        <Loading/>
      </Layout>
    );
  }

  if (!user || userError) {
    return (
      <Layout>
        <h2>Welcome to Guckelsberg</h2>
        <p>Please log in to view your personalized dashboard, manage bookings, and access resident tools.</p>
      </Layout>
    );
  }

  if (isError || !summary) {
    return (
      <Layout>
        <h2>Dashboard</h2>
        <p>We were unable to load your dashboard data right now.</p>
      </Layout>
    );
  }

  const washerUsage = summary.laundry.washerQuota.maxMinutes > 0
    ? Math.min(1, summary.laundry.washerQuota.usedMinutes / summary.laundry.washerQuota.maxMinutes)
    : 0;
  const dryerUsage = summary.laundry.dryerQuota.maxMinutes > 0
    ? Math.min(1, summary.laundry.dryerQuota.usedMinutes / summary.laundry.dryerQuota.maxMinutes)
    : 0;

  return (
    <Layout>
      <h2>Welcome back, {user.roomNumber}</h2>
      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardTitle}>Laundry overview</div>
          {summary.laundry.nextBooking ? (
            <div className={styles.list}>
              <div className={styles.metricRow}>
                <span>Next booking</span>
                <span className={styles.metricValue}>{formatDateRelativeToToday(new Date(summary.laundry.nextBooking.date))}</span>
              </div>
              <div>{summary.laundry.nextBooking.machineName} · starts at {formatSlot(summary.laundry.nextBooking.slotStart)}</div>
            </div>
          ) : (
            <p>You have no upcoming laundry bookings.</p>
          )}
          <div>
            <div className={styles.metricRow}>
              <span>Washer quota</span>
              <span>{minutesToHours(summary.laundry.washerQuota.usedMinutes)} / {minutesToHours(summary.laundry.washerQuota.maxMinutes)} h</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressInner} style={{width: `${washerUsage * 100}%`}}></div>
            </div>
          </div>
          <div>
            <div className={styles.metricRow}>
              <span>Dryer quota</span>
              <span>{minutesToHours(summary.laundry.dryerQuota.usedMinutes)} / {minutesToHours(summary.laundry.dryerQuota.maxMinutes)} h</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressInner} style={{width: `${dryerUsage * 100}%`}}></div>
            </div>
          </div>
          <div className={styles.metricRow}>
            <span>Bookings next 7 days</span>
            <span className={styles.metricValue}>{summary.laundry.upcomingBookingsWithinWeek}</span>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardTitle}>Rooftop snapshot</div>
          {summary.rooftop.nextBooking ? (
            <div className={styles.list}>
              <div className={styles.metricRow}>
                <span>Next rooftop booking</span>
                <span className={styles.metricValue}>{formatDateRelativeToToday(new Date(summary.rooftop.nextBooking.date))}</span>
              </div>
              <div>{summary.rooftop.nextBooking.reason || 'No reason provided'}</div>
            </div>
          ) : (
            <p>No upcoming rooftop bookings.</p>
          )}
          <div className={styles.metricRow}>
            <span>Pending requests</span>
            <span className={styles.metricValue}>{summary.rooftop.pendingRequests}</span>
          </div>
        </section>

        {summary.admin && (
          <section className={styles.card}>
            <div className={styles.cardTitle}>Admin metrics</div>
            {summary.admin.pendingRooftopRequests !== null && (
              <div className={styles.metricRow}>
                <span>Pending rooftop requests</span>
                <span className={styles.metricValue}>{summary.admin.pendingRooftopRequests}</span>
              </div>
            )}
            {summary.admin.upcomingRooftopEvents !== null && (
              <div className={styles.metricRow}>
                <span>Events next 7 days</span>
                <span className={styles.metricValue}>{summary.admin.upcomingRooftopEvents}</span>
              </div>
            )}
            {summary.admin.todaysLaundryBookings !== null && (
              <div className={styles.metricRow}>
                <span>Laundry bookings today</span>
                <span className={styles.metricValue}>{summary.admin.todaysLaundryBookings}</span>
              </div>
            )}
            {summary.admin.pendingRooftopRequests === null
            && summary.admin.upcomingRooftopEvents === null
            && summary.admin.todaysLaundryBookings === null && (
              <p>No admin metrics for your role.</p>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
}

function formatSlot(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}
