import {type Booking, type Machine, type MachineType, SLOTS,} from "../models.tsx";
import styles from "./NextFreeSlots.module.css";
import {useState} from "react";
import {toLocalDate} from "../../../utils.ts";
import {WindowedView} from "../../../components/WindowedView.tsx";
import {isSlotInPast, isSlotOngoing} from "../utils.ts";
import {useBookingsAfterToday, useCreateBooking, useMachines} from "../queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import {BookingCard} from "./BookingCard.tsx";
import {Button} from "../../../components/Button.tsx";

const DAYS_TO_CHECK = 2;

type TimeSlot = {
  machine: Machine,
  slot: number,
  date: Date,
}

function keyOf(timeSlot: TimeSlot) {
  return `${timeSlot.machine.name}+${timeSlot.slot}+${toLocalDate(timeSlot.date)}`;
}

// TODO: Not working with previous day buffers
function getFreeSlotsForMachineType(
  machineType: MachineType,
  machines: Machine[],
  bookings: Booking[],
  excludeOngoing: boolean = false,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slotToBooking = new Map<string, Booking>();
  if (bookings) {
    for (const booking of bookings) {
      slotToBooking.set(keyOf({
        machine: booking.machine,
        slot: booking.slotStart,
        date: new Date(booking.date)
      }), booking);
    }
  }
  const freeSlots: TimeSlot[] = [];
  for (let day = 0; day < DAYS_TO_CHECK; day++) {
    const date = new Date(today.getTime() + day * 24 * 60 * 60 * 1000);
    for (const slot of SLOTS) {
      for (const machine of machines) {
        if (machine.type !== machineType) continue;
        if (excludeOngoing && isSlotOngoing(slot, date)) continue;
        if (isSlotInPast(slot, date)) continue;
        const key = keyOf({machine, slot, date});
        if (!slotToBooking.has(key)) {
          freeSlots.push({machine, slot, date});
        }
      }
    }
  }
  return freeSlots;
}

function NextFreeSlotList({machineType, machines, bookings, excludeOngoing}: {
  machineType: MachineType,
  machines: Machine[],
  bookings: Booking[],
  excludeOngoing: boolean,
}) {
  const {mutateAsync: createBooking} = useCreateBooking();
  const handleCreateBooking = async (slot: TimeSlot) => {
    try {
      await createBooking({
        machineName: slot.machine.name,
        date: slot.date,
        slot: slot.slot,
      });
    } catch (error) {
      alert((error as Error).message);
      return;
    }
  };
  return (
    <div className={styles.nextFreeSlot}>
      {getFreeSlotsForMachineType(machineType, machines, bookings, excludeOngoing)
        .slice(0, 4)
        .map((slot, i) => (
          <BookingCard
            key={i}
            booking={{
              machine: slot.machine,
              slotStart: slot.slot,
              date: slot.date
            }}
          >
            <Button
              variant="primary"
              onClick={() => handleCreateBooking(slot)}
            >
              Book
            </Button>
          </BookingCard>
        ))}
    </div>
  )
}

export default function NextFreeSlots() {
  const {data: machines, ...machinesQuery} = useMachines();
  const {data: bookings, ...bookingsQuery} = useBookingsAfterToday();
  const [excludeOngoing] = useState(true);
  if (machinesQuery.isLoading || bookingsQuery.isLoading) {
    return <Loading/>;
  }
  if (machinesQuery.isError || !machines) {
    return <div>Error loading machines.</div>;
  }
  if (bookingsQuery.isError || !bookings) {
    return <div>Error loading bookings.</div>;
  }
  return (
    <>
      <WindowedView
        windows={[
          {
            name: "Washers",
            body: <NextFreeSlotList
              machineType={'WASHER'}
              machines={machines}
              bookings={bookings}
              excludeOngoing={excludeOngoing}
            />
          },
          {
            name: "Dryers",
            body: <NextFreeSlotList
              machineType={'DRYER'}
              machines={machines}
              bookings={bookings}
              excludeOngoing={excludeOngoing}
            />
          }
        ]}
      />
    </>
  )
}

