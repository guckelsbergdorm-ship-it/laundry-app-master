import {type FlatSlot, fromFlatSlot, iconOfMachineType, prettifySlot, toFlatSlot} from "../models.tsx";
import {Button} from "../../../components/Button.tsx";
import styles from './LaundryCheckout.module.css';
import clsx from "clsx";
import {useCreateBatchBookings, useMachines} from "../queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import {MdArrowForwardIos} from "react-icons/md";
import {useEffect, useState} from "react";
import {MessageBox} from "../../../components/MessageBox.tsx";
import {DeleteButton} from "./DeleteButton.tsx";

type Props = {
  date: Date;
  selectedSlots: Set<FlatSlot>;
  setSelectedSlots: (slots: Set<FlatSlot>) => void;
}

type Message = {
  type: 'error' | 'success';
  text: string;
}

export function LaundryCheckout({date, selectedSlots, setSelectedSlots}: Props) {
  const {data: machines, isLoading} = useMachines();
  const {mutateAsync: createBatchBookings} = useCreateBatchBookings();
  const [message, setMessage] = useState<Message | null>(null);
  useEffect(() => {
    setMessage(null);
  }, [selectedSlots]);
  if (isLoading) {
    return <Loading/>;
  }
  if (!machines) {
    return <div>Error loading machines.</div>;
  }
  const slots = Array.from(selectedSlots).map(s => fromFlatSlot(s));

  const handleBookSlots = async () => {
    const bookings = Array.from(selectedSlots).map(s => {
      const slot = fromFlatSlot(s);
      return {
        date,
        machineName: slot.machineName,
        slot: slot.slot,
      }
    });
    setSelectedSlots(new Set());
    try {
      await createBatchBookings(bookings);
      setMessage({
        type: 'success',
        text: `Successfully booked all slots.`
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `${(err as Error).message}`
      })
    }
  }
  return (
    <div className={styles.container}>
      <h2>Checkout</h2>
      {message && (
        <MessageBox message={message}/>
      )}
      <div className={styles.slotsContainer}>
        {slots.map((slot, index) => {
          const machine = machines.find(m => m.name === slot.machineName);
          return (
            <div key={index} className={clsx(styles.slotCard, "flex-text")}>
              <div className={clsx(styles.machineName, "flex-text")}>
                {machine && iconOfMachineType(machine.type)}
                &nbsp;
                {slot.machineName}
              </div>
              <div className={styles.separator}>
                |
              </div>
              <div className={clsx(styles.timeSlot, "flex-text")}>
                {prettifySlot(slot.slot)}
                <MdArrowForwardIos/> {prettifySlot(slot.slot + (machine?.slotDuration ?? 0))}
              </div>
              <DeleteButton
                rightAlign
                onClick={() => {
                  const newSlots = new Set(selectedSlots);
                  newSlots.delete(toFlatSlot(slot));
                  setSelectedSlots(newSlots);
                }}
              />
            </div>
          );
        })}
      </div>
      {selectedSlots.size === 0
        ? (
          <Button variant="empty" disabled>
            No Selected Slots
          </Button>
        )
        : (
          <Button variant="primary" onClick={handleBookSlots}>
            Book Slots
          </Button>
        )}
    </div>
  )
}
