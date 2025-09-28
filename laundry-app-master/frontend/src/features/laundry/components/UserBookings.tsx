import {type Booking, prettifySlot} from "../models.tsx";
import styles from "./UserBookings.module.css";
import {Button} from "../../../components/Button.tsx";
import {useDeleteBooking, useUserBookingsInTheFuture} from "../queries.ts";
import {isBookingOngoing} from "../utils.ts";
import {Loading} from "../../../components/Loading.tsx";
import {BookingCard} from "./BookingCard.tsx";

export default function UserBookings() {
  const {data: bookings, isLoading, isError} = useUserBookingsInTheFuture();
  const {mutateAsync: deleteBooking} = useDeleteBooking();
  if (isLoading) {
    return <Loading/>;
  }
  if (isError || !bookings) {
    return <div>Error loading user data.</div>;
  }
  const handleDelete = async (booking: Booking) => {
    try {
      if (!confirm(`Are you sure you want to delete this booking?: ${booking.machine.name} `
        + `from ${prettifySlot(booking.slotStart)} `
        + `to ${prettifySlot(booking.slotStart + booking.machine.slotDuration)}`)) {
        return;
      }
      await deleteBooking(booking.id);
    } catch (err) {
      alert((err as Error).message);
      return;
    }
  };
  return (
    <>
      <div className={styles.userBookings}>
        {bookings.map((booking, i) => {
          const isOngoing = isBookingOngoing(booking);
          return (
            <BookingCard key={i} booking={{
              machine: booking.machine,
              slotStart: booking.slotStart,
              date: new Date(booking.date),
            }}>
              {isOngoing ? (
                  <Button variant="empty" disabled>
                    Ongoing
                  </Button>
                )
                : (
                  <Button variant="danger" onClick={() => handleDelete(booking)}>
                    Cancel
                  </Button>
                )}
            </BookingCard>
          )
        })}
        {bookings.length == 0 && (
          <div className="subtext">You have no bookings in the future.</div>
        )}
      </div>
    </>
  )
}
