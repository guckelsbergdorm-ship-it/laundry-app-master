import {useMemo, useState} from "react";
import {useCancelBookingRequest, useMyBookingRequests, useMyRooftopBookings} from "../queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import {Button} from "../../../components/Button.tsx";
import {formatDateRelativeToToday, toLocalDate} from "../../../utils.ts";
import type {RooftopBookingRequest} from "../models.ts";

export function RooftopHistory() {
  const [showPast, setShowPast] = useState(false);
  const now = useMemo(() => new Date(), []);
  const {data: bookings, isLoading: bookingsLoading} = useMyRooftopBookings({
    from: showPast ? undefined : now,
  });
  const {
    data: requests,
    isLoading: requestsLoading,
    refetch: refetchRequests
  } = useMyBookingRequests();
  const {mutateAsync: cancelRequest, isPending: cancelling} = useCancelBookingRequest();

  if (bookingsLoading || requestsLoading) {
    return <Loading/>;
  }

  const todayIso = toLocalDate(now);
  const upcomingBookings = (bookings ?? []).filter(booking => {
    if (showPast) {
      return true;
    }
    return booking.date >= todayIso;
  });

  const sortedRequests = [...(requests ?? [])].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleCancel = async (request: RooftopBookingRequest) => {
    if (!confirm(`Cancel your request for ${request.date}?`)) {
      return;
    }
    try {
      await cancelRequest(request.id);
      await refetchRequests();
      alert('Request cancelled.');
    } catch (error) {
      alert(`Failed to cancel request: ${(error as Error).message}`);
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
      <section>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between'}}>
          <h3 style={{margin: 0}}>My bookings</h3>
          <label style={{display: 'flex', alignItems: 'center', gap: '0.35rem'}}>
            <input
              type="checkbox"
              checked={showPast}
              onChange={event => setShowPast(event.target.checked)}
            />
            Show past bookings
          </label>
        </div>
        {upcomingBookings.length === 0 ? (
          <div style={{marginTop: '0.75rem'}}>No bookings yet.</div>
        ) : (
          <div style={{overflowX: 'auto', marginTop: '0.75rem'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
              <tr>
                <th style={{textAlign: 'left', padding: '0.5rem'}}>Date</th>
                <th style={{textAlign: 'left', padding: '0.5rem'}}>Reason</th>
              </tr>
              </thead>
              <tbody>
              {upcomingBookings.map(booking => (
                <tr key={booking.id}>
                  <td style={{padding: '0.5rem', borderBottom: '1px solid var(--clr-surface-tonal-a20)'}}>
                    {formatDateRelativeToToday(new Date(booking.date))}
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
      </section>

      <section>
        <h3>Request history</h3>
        {sortedRequests.length === 0 ? (
          <div>No rooftop requests yet.</div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
              <tr>
                <th style={{textAlign: 'left', padding: '0.5rem'}}>Date</th>
                <th style={{textAlign: 'left', padding: '0.5rem'}}>Status</th>
                <th style={{textAlign: 'left', padding: '0.5rem'}}>Time span</th>
                <th style={{textAlign: 'left', padding: '0.5rem'}}>Notes</th>
                <th style={{textAlign: 'left', padding: '0.5rem'}}>Actions</th>
              </tr>
              </thead>
              <tbody>
              {sortedRequests.map(request => (
                <tr key={request.id}>
                  <td style={{padding: '0.5rem', borderBottom: '1px solid var(--clr-surface-tonal-a20)'}}>
                    {formatDateRelativeToToday(new Date(request.date))}
                  </td>
                  <td style={{padding: '0.5rem', borderBottom: '1px solid var(--clr-surface-tonal-a20)'}}>
                    {request.status}
                  </td>
                  <td style={{padding: '0.5rem', borderBottom: '1px solid var(--clr-surface-tonal-a20)'}}>
                    {request.timeSpan}
                  </td>
                  <td style={{padding: '0.5rem', borderBottom: '1px solid var(--clr-surface-tonal-a20)'}}>
                    {request.decisionReason ?? '—'}
                  </td>
                  <td style={{padding: '0.5rem', borderBottom: '1px solid var(--clr-surface-tonal-a20)'}}>
                    {request.status === 'REQUESTED' ? (
                      <Button
                        variant="danger"
                        disabled={cancelling}
                        onClick={() => handleCancel(request)}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <span style={{color: 'var(--clr-surface-a60)'}}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}