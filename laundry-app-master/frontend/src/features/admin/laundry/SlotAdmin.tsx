import {useState} from "react";
import styles from "./SlotAdmin.module.css";
import {useMachines, useCreateOverride, useDeleteOverride, useLaundryOverridesRange} from "../../laundry/queries.ts";
import {MessageBox, type Message} from "../../../components/MessageBox.tsx";
import {Button} from "../../../components/Button.tsx";
import {Loading} from "../../../components/Loading.tsx";
import {SLOTS, prettifySlot} from "../../laundry/models.tsx";
import {toLocalDate} from "../../../utils.ts";

const SLOT_OPTIONS = SLOTS.map(slot => ({value: slot, label: prettifySlot(slot)}));

function toDateInputValue(date: Date) {
  return toLocalDate(date);
}

function toDateFromInput(value: string, fallback: Date) {
  if (!value) {
    return fallback;
  }
  const parts = value.split("-");
  if (parts.length !== 3) {
    return fallback;
  }
  const [year, month, day] = parts.map(part => Number(part));
  const next = new Date(fallback);
  next.setFullYear(year, month - 1, day);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function SlotAdmin() {
  const today = new Date();
  const [fromDate, setFromDate] = useState(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 3);
    start.setHours(0, 0, 0, 0);
    return start;
  });
  const [toDate, setToDate] = useState(() => {
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    end.setHours(0, 0, 0, 0);
    return end;
  });
  const [machineFilter, setMachineFilter] = useState<'ALL' | string>('ALL');
  const [machineName, setMachineName] = useState<string>('');
  const [status, setStatus] = useState<'BLOCKED' | 'EXTENDED'>('BLOCKED');
  const [formStartDate, setFormStartDate] = useState<string>(toLocalDate(today));
  const [formEndDate, setFormEndDate] = useState<string>(toLocalDate(today));
  const [startSlot, setStartSlot] = useState<string>('');
  const [endSlot, setEndSlot] = useState<string>('');
  const [message, setMessage] = useState<Message | undefined>();

  const {data: machines, isLoading: machinesLoading, isError: machinesError} = useMachines();
  const {
    data: overrides,
    isLoading: overridesLoading,
    isError: overridesError,
    error: overridesQueryError
  } = useLaundryOverridesRange(
    fromDate,
    toDate,
    machineFilter === 'ALL' ? undefined : machineFilter
  );
  const {mutateAsync: createOverride, isPending: isCreating} = useCreateOverride();
  const {mutateAsync: deleteOverride, isPending: isDeleting} = useDeleteOverride();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(undefined);
    if (!machineName) {
      setMessage({type: 'error', text: 'Please choose a machine.'});
      return;
    }
    try {
      await createOverride({
        machineName,
        status,
        startDate: formStartDate,
        endDate: formEndDate,
        startSlot: startSlot ? Number(startSlot) : null,
        endSlot: endSlot ? Number(endSlot) : null,
      });
      setMessage({type: 'success', text: 'Override created successfully.'});
    } catch (error) {
      setMessage({type: 'error', text: error instanceof Error ? error.message : 'Failed to create override.'});
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteOverride(id);
      setMessage({type: 'success', text: 'Override deleted.'});
    } catch (error) {
      setMessage({type: 'error', text: error instanceof Error ? error.message : 'Failed to delete override.'});
    }
  };

  if (machinesLoading || overridesLoading) {
    return <Loading/>;
  }

  if (machinesError) {
    return <div>Failed to load machine list.</div>;
  }

  if (overridesError) {
    const message = overridesQueryError instanceof Error ? overridesQueryError.message : 'Failed to load overrides.';
    return <div>{message}</div>;
  }

  return (
    <div className={styles.container}>
      <div>
        <h2>Slot Overrides</h2>
        <p>Block slots for maintenance or extend availability temporarily without editing machine definitions.</p>
      </div>

      <div className={styles.filters}>
        <div className={styles.field}>
          <label htmlFor="filterMachine">Machine</label>
          <select
            id="filterMachine"
            value={machineFilter}
            onChange={event => setMachineFilter(event.target.value as 'ALL' | string)}
          >
            <option value="ALL">All machines</option>
            {machines?.map(machine => (
              <option key={machine.name} value={machine.name}>{machine.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="fromDate">From</label>
          <input
            id="fromDate"
            type="date"
            value={toDateInputValue(fromDate)}
            onChange={event => setFromDate(toDateFromInput(event.target.value, fromDate))}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="toDate">To</label>
          <input
            id="toDate"
            type="date"
            value={toDateInputValue(toDate)}
            onChange={event => setToDate(toDateFromInput(event.target.value, toDate))}
          />
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="machineName">Machine</label>
          <select id="machineName" value={machineName} onChange={event => setMachineName(event.target.value)}>
            <option value="">Select machine…</option>
            {machines?.map(machine => (
              <option key={machine.name} value={machine.name}>{machine.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={event => setStatus(event.target.value as 'BLOCKED' | 'EXTENDED')}>
            <option value="BLOCKED">Blocked</option>
            <option value="EXTENDED">Extended</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="startDate">Start date</label>
          <input
            id="startDate"
            type="date"
            value={formStartDate}
            onChange={event => setFormStartDate(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="endDate">End date</label>
          <input
            id="endDate"
            type="date"
            value={formEndDate}
            onChange={event => setFormEndDate(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="startSlot">Start slot (optional)</label>
          <select id="startSlot" value={startSlot} onChange={event => setStartSlot(event.target.value)}>
            <option value="">Whole day</option>
            {SLOT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="endSlot">End slot (optional)</label>
          <select id="endSlot" value={endSlot} onChange={event => setEndSlot(event.target.value)}>
            <option value="">Whole day</option>
            {SLOT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={isCreating}>
            {isCreating ? 'Saving…' : 'Create override'}
          </Button>
          <Button type="button" onClick={() => {
            setMachineName('');
            setStatus('BLOCKED');
            setFormStartDate(toLocalDate(today));
            setFormEndDate(toLocalDate(today));
            setStartSlot('');
            setEndSlot('');
          }}>
            Reset form
          </Button>
        </div>
      </form>

      <MessageBox message={message}/>

      <div className={styles.summary}>
        <span>{`Total overrides: ${overrides?.length ?? 0}`}</span>
        <span>{`Window: ${toLocalDate(fromDate)} → ${toLocalDate(toDate)}`}</span>
      </div>

      <div className={styles.tableWrapper}>
        <table>
          <thead>
          <tr>
            <th>Machine</th>
            <th>Status</th>
            <th>Dates</th>
            <th>Slots</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          {(overrides ?? []).map(override => (
            <tr key={override.id}>
              <td>{override.machineName}</td>
              <td>{override.status}</td>
              <td>{`${override.startDate} → ${override.endDate}`}</td>
              <td>{override.startSlot === null && override.endSlot === null
                ? 'Whole day'
                : `${override.startSlot === null ? 'Start of day' : prettifySlot(override.startSlot)} → ${override.endSlot === null ? 'End of day' : prettifySlot(override.endSlot)}`
              }</td>
              <td>
                <div>{override.createdBy}</div>
                <div style={{fontSize: '0.75rem', color: 'var(--clr-surface-a60)'}}>
                  {new Date(override.createdAt).toLocaleString()}
                </div>
              </td>
              <td>
                <Button
                  variant="danger"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    if (!confirm('Delete this override?')) {
                      return;
                    }
                    void handleDelete(override.id);
                  }}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
          {(!overrides || overrides.length === 0) && (
            <tr>
              <td colSpan={6} style={{textAlign: 'center', padding: '1rem'}}>
                No overrides in the selected window.
              </td>
            </tr>
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}