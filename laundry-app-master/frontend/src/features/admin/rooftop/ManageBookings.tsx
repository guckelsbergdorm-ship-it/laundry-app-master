import {useState} from "react";
import {useAdminRooftopBookings} from "../../rooftop/queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import {formatDateRelativeToToday} from "../../../utils.ts";

export function ManageBookings() {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [bookerRoom, setBookerRoom] = useState('');
  const {data: bookings, isLoading, isError} = useAdminRooftopBookings({
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
    bookerRoom: bookerRoom || undefined,
  });

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.75rem'}}>
        <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
          From
          <input
            type="date"
            value={from}
            onChange={event => setFrom(event.target.value)}
          />
        </label>
        <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
          To
          <input
            type="date"
            value={to}
            onChange={event => setTo(event.target.value)}
          />
        </label>
        <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
          Booker room
          <input
            type="text"
            placeholder="e.g. 05-03-01"
            value={bookerRoom}
            onChange={event => setBookerRoom(event.target.value)}
          />
        </label>
      </div>

      {isLoading && <Loading/>}
      {isError && !isLoading && <div>Error loading bookings.</div>}

      {bookings && bookings.length === 0 && !isLoading && (
        <div>No bookings match the current filters.</div>
      )}

      {bookings && bookings.length > 0 && (
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
            <tr>
              <th style={{textAlign: 'left', padding: '0.5rem'}}>Date</th>
              <th style={{textAlign: 'left', padding: '0.5rem'}}>Booker</th>
              <th style={{textAlign: 'left', padding: '0.5rem'}}>Reason</th>
            </tr>
            </thead>
            <tbody>
            {bookings.map(booking => (
              <tr key={booking.id}>
                <td style={{padding: '0.5rem', borderBottom: '1px solid var(--clr-surface-tonal-a20)'}}>
                  {formatDateRelativeToToday(new Date(booking.date))}
                </td>
                <td style={{padding: '0.5rem', borderBottom: '1px solid var(--clr-surface-tonal-a20)'}}>
                  {booking.bookerRoomNumber}
                </td>
                <td style={{padding: '0.5rem', borderBottom: '1px solid var(--clr-surface-tonal-a20)'}}>
                  {booking.reason ?? '—'}
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}