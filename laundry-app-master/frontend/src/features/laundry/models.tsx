import {BiSolidDryer, BiSolidWasher} from "react-icons/bi";

export type MachineType = 'WASHER' | 'DRYER';

export type Machine = {
  name: string;
  type: MachineType;
  slotDuration: number;
}

export type Booking = {
  id: number;
  bookerRoomNumber: string;
  machine: Machine,
  date: string,
  slotStart: number,
  createdAt: Date,
}

export type BookingData = {
  date: string | Date;
  slotStart: number;
  machine: Machine;
}

export type Slot = {
  slot: number;
  machineName: string;
}

export const BASE_SLOT_DURATION = 90;

export const SLOTS: number[] = []
for (let i = 0; i < 60 * 24 ; i += BASE_SLOT_DURATION) {
  SLOTS.push(i)
}

export function getCurrentSlot(): number {
  const now = new Date();
  return Math.floor((now.getHours() * 60 + now.getMinutes()) / BASE_SLOT_DURATION) * BASE_SLOT_DURATION;
}

export type FlatSlot = number & '-' & string;

export function toFlatSlot(slot: Slot): FlatSlot {
  return `${slot.slot}-${slot.machineName}` as FlatSlot;
}

export function fromFlatSlot(flatSlot: FlatSlot): Slot {
  const [slot, machineName] = (flatSlot as string).split('-');
  return {
    slot: parseInt(slot, 10),
    machineName,
  };
}

export function prettifySlot(slot: number): string {
  if (slot >= 24 * 60) {
    return `${prettifySlot(slot - 24 * 60)}`;
  }
  return `${Math.floor(slot / 60)}:${(slot % 60).toString().padStart(2, "0")}`;
}

export function iconOfMachineType(type: MachineType) {
  return type === 'WASHER' ? <BiSolidWasher/> : <BiSolidDryer/>;
}

export type LaundrySlotOverrideStatus = 'BLOCKED' | 'EXTENDED';

export type LaundrySlotOverride = {
  id: number;
  machineName: string;
  status: LaundrySlotOverrideStatus;
  startDate: string;
  endDate: string;
  startSlot: number | null;
  endSlot: number | null;
  createdBy: string;
  createdAt: string;
};

export function appliesToSlot(override: LaundrySlotOverride, slotStart: number, date: Date): boolean {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const start = new Date(override.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(override.endDate);
  end.setHours(0, 0, 0, 0);
  if (target < start || target > end) {
    return false;
  }
  const afterStart = override.startSlot === null || slotStart >= override.startSlot;
  const beforeEnd = override.endSlot === null || slotStart <= override.endSlot;
  return afterStart && beforeEnd;
}
