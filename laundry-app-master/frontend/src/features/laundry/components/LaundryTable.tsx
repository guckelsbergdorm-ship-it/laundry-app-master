import {useBookingsByDate, useDeleteBooking, useLaundryOverrides, useMachines} from "../queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import styles from "./LaundryTable.module.css";
import clsx from "clsx";
import {useMemo, useState} from "react";
import {DateControls} from "../../../components/DateControls.tsx";
import {
  BASE_SLOT_DURATION,
  type Booking,
  type FlatSlot,
  iconOfMachineType,
  type LaundrySlotOverride,
  appliesToSlot,
  type Machine,
  prettifySlot,
  type Slot,
  SLOTS,
  toFlatSlot
} from "../models.tsx";
import {LaundryCheckout} from "./LaundryCheckout.tsx";
import {MdKeyboardArrowRight} from "react-icons/md";
import {FaHouseChimney} from "react-icons/fa6";
import {useUserData} from "../../user/queries.ts";
import {DeleteButton} from "./DeleteButton.tsx";
import {isBookingInPast, isBookingOngoing, isSlotInPast, isSlotOngoing} from "../utils.ts";
import {FaAngleDoubleDown, FaAngleDoubleUp} from "react-icons/fa";
import type {UserData} from "../../user/models.ts";

type ExtendedBooking = Booking & { isBuffer?: boolean };

type Cell = {
  slot: number;
  machine: Machine;
  type: 'free' | 'booked' | 'selected' | 'hovered' | 'covered' | 'blocked' | 'extended';
  rowSpan: number;
  booking?: ExtendedBooking;
  override?: LaundrySlotOverride;
}

const keyOf = (slot: number, machine: Machine) => `${machine.name}-${slot}`;

const slots = Array.from(SLOTS);
slots.push(1440); // Add dummy slot for next day buffer

function renderCellContent(cell: Cell, user: UserData | undefined, deleteBooking: (bookingId: number) => void) {
  if (cell.type === 'booked' && cell.booking) {
    if (user && cell.booking.bookerRoomNumber === user.roomNumber) {
      const canDelete = !isBookingOngoing(cell.booking) && !isBookingInPast(cell.booking);
      return (
        <div className={clsx(styles.selectBox, styles.ownBooking)}>
          {cell.booking.isBuffer && (
            <>
              {cell.booking.slotStart !== 0
                ? <FaAngleDoubleUp fill="var(--clr-primary-a30)"/>
                : <FaAngleDoubleDown fill="var(--clr-primary-a30)"/>}
              &nbsp;
            </>
          )}
          <FaHouseChimney/>
          &nbsp;&nbsp;
          {cell.booking.bookerRoomNumber}
          {canDelete && (
            <DeleteButton
              onClick={async () => {
                if (!cell.booking) return;
                try {
                  if (!confirm(`Are you sure you want to delete this booking?: ${cell.booking.machine.name} `
                    + `from ${prettifySlot(cell.booking.slotStart)} `
                    + `to ${prettifySlot(cell.booking.slotStart + cell.booking.machine.slotDuration)}`)) {
                    return;
                  }
                  deleteBooking(cell.booking.id);
                } catch (error) {
                  alert((error as Error).message);
                  return;
                }
              }
              }
            />
          )}
        </div>
      )
    }
    return (
      <div className={clsx(styles.selectBox, styles.booked)}>
        {cell.booking.bookerRoomNumber}
      </div>
    )
  }
  if (cell.type === 'selected') {
    return (
      <div className={clsx(styles.selectBox, styles.selected)}>
        Selected
      </div>
    );
  }
  if (cell.type === 'hovered') {
    return (
      <div className={styles.selectBox}>
        Select
      </div>
    );
  }
  if (cell.type === 'free') {
    return "Free";
  }
  if (cell.type === 'blocked') {
    return (
      <div className={clsx(styles.selectBox, styles.conflicting)}>
        Blocked
      </div>
    );
  }
  if (cell.type === 'extended') {
    return (
      <div className={clsx(styles.selectBox, styles.extended)}>
        Extended
      </div>
    );
  }
  return null;
}

export function LaundryTable() {
  const {data: machines, ...machinesQuery} = useMachines();
  const [date, setDate] = useState(new Date());
  const [hoveredSlot, setHoveredSlot] = useState<Slot | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Set<FlatSlot>>(new Set<FlatSlot>());
  const {data: bookings} = useBookingsByDate(date, true);
  const {data: overrides} = useLaundryOverrides(date);
  const {data: userData} = useUserData();
  const {mutate: deleteBooking} = useDeleteBooking();
  if (machinesQuery.isLoading) {
    return <Loading/>;
  }
  if (machinesQuery.isError || !machines) {
    return <span>Error loading machine data..-</span>
  }
  const slotToBooking = new Map<string, ExtendedBooking>();
  if (bookings) {
    for (const booking of bookings) {
      // Have to normalize dates to start of day manually
      const dateStartOfDay = new Date(date);
      const bookingDateStartOfDay = new Date(booking.date);
      dateStartOfDay.setHours(0, 0, 0, 0);
      bookingDateStartOfDay.setHours(0, 0, 0, 0);
      if (bookingDateStartOfDay.getTime() < dateStartOfDay.getTime()) {
        // Yesterday
        slotToBooking.set(keyOf(0, booking.machine), {...booking, isBuffer: true});
      } else if (bookingDateStartOfDay.getTime() > dateStartOfDay.getTime()) {
        // Tomorrow
        slotToBooking.set(keyOf(24 * 60, booking.machine), {
          ...booking, isBuffer: true
        });
      } else {
        slotToBooking.set(keyOf(booking.slotStart, booking.machine), booking);
      }
    }
  }
  const overridesByMachine = useMemo(() => {
    const map = new Map<string, LaundrySlotOverride[]>();
    if (!overrides) {
      return map;
    }
    for (const override of overrides) {
      const existing = map.get(override.machineName) ?? [];
      existing.push(override);
      map.set(override.machineName, existing);
    }
    return map;
  }, [overrides]);

  // Build cell grid
  const cells: Cell[][] = [];
  machines.forEach((machine) => {
    const row: Cell[] = [];
    slots.forEach((slot) => {
      const prev = row.find(c =>
        c.type !== "covered" && c.type !== "free"
        && slot > c.slot
        && slot < c.slot + c.machine.slotDuration)
      const isSelected = selectedSlots.has(toFlatSlot({slot, machineName: machine.name}));
      const isHovered = hoveredSlot?.machineName === machine.name && hoveredSlot?.slot === slot;
      const booking = slotToBooking.get(keyOf(slot, machine));
      const machineOverrides = overridesByMachine.get(machine.name) ?? [];
      const blockedOverride = machineOverrides.find(o => o.status === 'BLOCKED' && appliesToSlot(o, slot, date));
      const extendedOverride = machineOverrides.find(o => o.status === 'EXTENDED' && appliesToSlot(o, slot, date));
      let type: Cell['type'] = 'free';
      if (booking) type = 'booked';
      else if (blockedOverride) type = 'blocked';
      else if (isSelected) type = 'selected';
      else if (isHovered) type = 'hovered';
      else if (extendedOverride) type = 'extended';
      const rowSpan = booking?.isBuffer
        ? 1 // Override for bookings that started before/after the current day
        : type === 'free'
          ? 1
          : machine.slotDuration / BASE_SLOT_DURATION;
      if (prev) {
        if ((isSelected || booking) && !prev.booking?.isBuffer) {
          prev.type = 'blocked';
          prev.rowSpan = 1;
          row.push({slot, machine, type, rowSpan, booking});
          return;
        }
        if (prev.booking?.isBuffer) {
          row.push({slot, machine, type, rowSpan, booking});
        } else {
          row.push({slot, machine, type: 'covered', rowSpan: 0});
        }
        return;
      }
      row.push({slot, machine, type, rowSpan, booking, override: blockedOverride ?? extendedOverride});
    });
    cells.push(row);
  });

  const handleSelect = (cell: Cell) => {
    if (cell.type === 'blocked') {
      return;
    }
    const flatSlot = toFlatSlot({slot: cell.slot, machineName: cell.machine.name});
    const found = selectedSlots.has(flatSlot);
    const newSlots = new Set(selectedSlots);
    if (found) {
      newSlots.delete(flatSlot);
    } else if (cell.type === 'free' || cell.type === 'hovered') {
      newSlots.add(flatSlot);
    }
    setSelectedSlots(newSlots);
  }

  return (
    <div className={styles.container}>
      <DateControls date={date} setDate={setDate} variant="daily"/>
      <div className={styles.gridContainer}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `100px repeat(${machines.length}, 1fr)`,
            gridTemplateRows: `auto repeat(${slots.length}, var(--slot-row-height))`,
          }}
        >
          <div className={styles.machineHeader} style={{gridRow: 1, gridColumn: 1}}/>

          {machines.map((machine, mi) => (
            <div
              key={machine.name}
              className={clsx(styles.machineHeader, mi == machines.length - 1 && styles.lastInRow)}
              style={{gridRow: 1, gridColumn: mi + 2}}
            >
              {iconOfMachineType(machine.type)}
              &nbsp;&nbsp;
              {machine.name}
            </div>
          ))}

          {slots.map((slot, ri) => (
            <div
              key={slot}
              className={clsx(
                styles.timeHeader,
                ri === slots.length - 1 && styles.lastInColumn && styles.nextDay,
                isSlotOngoing(slot, date) && styles.currentTimeSlot
              )}
              style={{gridRow: ri + 2, gridColumn: 1}}
            >
              {isSlotOngoing(slot, date) && (
                <MdKeyboardArrowRight
                  size={24}
                  fill="var(--clr-primary-a10)"
                  style={{
                    flex: '0 0 auto',
                  }}
                />
              )}
              {prettifySlot(slot)}
            </div>
          ))}

          {cells.map((row, mi) =>
            row.map((cell, ri) => {
              if (cell.type === 'covered') return null;
              const isNextDay = ri == slots.length - 1;
              return (
                <div
                  key={keyOf(cell.slot, cell.machine)}
                  className={clsx(
                    styles.slotCell,
                    cell.machine.slotDuration !== BASE_SLOT_DURATION && styles.dotted,
                    cell.type === 'hovered' && styles.selected,
                    cell.type === 'booked' && styles.booked,
                    cell.type === 'blocked' && styles.notSelectable,
                    mi == machines.length - 1 && styles.lastInRow,
                    isNextDay && styles.lastInColumn && styles.nextDay,
                    isSlotOngoing(cell.slot, date) && styles.currentTimeSlot,
                    isSlotInPast(cell.slot, date) && styles.notSelectable
                  )}
                  style={{
                    gridRow: `${ri + 2} / span ${cell.rowSpan}`,
                    gridColumn: mi + 2,
                  }}
                  {...(!isNextDay && !isSlotInPast(cell.slot, date) && cell.type !== 'blocked' && {
                    onMouseEnter: () => setHoveredSlot({slot: cell.slot, machineName: cell.machine.name}),
                    onMouseLeave: () => setHoveredSlot(null)
                  })}
                  {...(!isNextDay && !isSlotInPast(cell.slot, date) && cell.type !== 'blocked' && {
                    onClick: () => handleSelect(cell),
                  })}
                >
                  {renderCellContent(cell, userData, deleteBooking)}
                </div>
              )
            }))}
        </div>
      </div>
      <LaundryCheckout date={date} selectedSlots={selectedSlots} setSelectedSlots={setSelectedSlots}/>
    </div>
  );
}
