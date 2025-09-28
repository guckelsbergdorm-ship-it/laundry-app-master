import {useMemo, useState} from "react";
import type {RooftopBookingRequest} from "../../rooftop/models.ts";
import {
  useApproveBookingRequest,
  usePendingBookingRequests,
  useRejectBookingRequest
} from "../../rooftop/queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import {Card} from "../../../components/Card.tsx";
import {Button} from "../../../components/Button.tsx";
import {formatDateRelativeToToday, toLocalDate} from "../../../utils.ts";

const statusOptions: RooftopBookingRequest['status'][] = ['REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED'];

export function ManageRequests() {
  const today = useMemo(() => new Date(), []);
  const [status, setStatus] = useState<RooftopBookingRequest['status']>('REQUESTED');
  const [bookerFilter, setBookerFilter] = useState('');
  const {data: requests, isLoading, isError} = usePendingBookingRequests({
    status,
    from: status === 'REQUESTED' ? today : undefined,
    bookerRoom: bookerFilter || undefined,
  });
  const {mutateAsync: approveRequest} = useApproveBookingRequest();
  const {mutateAsync: rejectRequest} = useRejectBookingRequest();
  const [decisionNotes, setDecisionNotes] = useState<Record<number, string>>({});

  if (isLoading) {
    return <Loading/>;
  }
  if (isError || !requests) {
    return <div>Error loading requests.</div>;
  }

  const handleApprove = async (id: number) => {
    try {
      await approveRequest({id, decision: {reason: decisionNotes[id]} });
      setDecisionNotes(prev => ({...prev, [id]: ''}));
      alert("Request approved.");
    } catch (error) {
      alert(`Failed to approve request: ${(error as Error).message}`);
    }
  };

  const handleReject = async (id: number) => {
    const reason = decisionNotes[id];
    if (!reason || reason.trim().length === 0) {
      alert('Please provide a rejection reason.');
      return;
    }
    try {
      await rejectRequest({id, decision: {reason}});
      setDecisionNotes(prev => ({...prev, [id]: ''}));
      alert('Request rejected.');
    } catch (error) {
      alert(`Failed to reject request: ${(error as Error).message}`);
    }
  };

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "1rem"}}>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.75rem'}}>
        <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
          Status
          <select value={status} onChange={event => setStatus(event.target.value as RooftopBookingRequest['status'])}>
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label style={{display: 'flex', flexDirection: 'column', gap: '0.35rem'}}>
          Booker room
          <input
            type="text"
            placeholder="e.g. 05-03-01"
            value={bookerFilter}
            onChange={event => setBookerFilter(event.target.value)}
          />
        </label>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: '0.5rem'}}>
          <strong>{`Matches: ${requests.length}`}</strong>
        </div>
      </div>

      {requests.length === 0 && (
        <div>No requests match the current filters.</div>
      )}

      {requests.map(request => (
        <Card
          key={request.id}
          data={request}
          title={`Request by ${request.bookerRoomNumber}`}
          columns={[
            [
              {
                key: 'date',
                valueRender: (value) => formatDateRelativeToToday(new Date(value))
              },
              'reason',
              'contact',
              'status',
              {
                key: 'reviewedByRoomNumber',
                label: 'Reviewed by'
              },
              {
                key: 'reviewedAt',
                label: 'Reviewed at',
                valueRender: (value) => value ? new Date(value as string).toLocaleString() : '—'
              },
              {
                key: 'decisionReason',
                label: 'Decision reason',
                valueRender: (value) => value ?? '—'
              },
              'timeSpan'
            ]
          ]}
        >
          {request.status === 'REQUESTED' ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
              <textarea
                placeholder="Optional note for approval / required for rejection"
                value={decisionNotes[request.id] ?? ''}
                onChange={event => setDecisionNotes(prev => ({...prev, [request.id]: event.target.value}))}
                style={{minHeight: '80px', resize: 'vertical'}}
              />
              <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                <Button variant="primary" onClick={() => handleApprove(request.id)}>Approve</Button>
                <Button variant="danger" onClick={() => handleReject(request.id)}>Reject</Button>
              </div>
              <small>Requested for {toLocalDate(new Date(request.date))}</small>
            </div>
          ) : (
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <Button variant="empty" disabled>
                {request.status}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
