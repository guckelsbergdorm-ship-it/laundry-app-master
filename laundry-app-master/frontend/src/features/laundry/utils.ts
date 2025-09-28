import {BASE_SLOT_DURATION, type BookingData, getCurrentSlot} from "./models.tsx";

export function isSlotOngoing(slot: number, date: Date): boolean {
  const dateAtMidnight = new Date(date);
  dateAtMidnight.setHours(0, 0, 0, 0);
  const slotMinutes = slot + dateAtMidnight.getTime() / (1000 * 60);
  const currentMinutes = new Date().getTime() / (1000 * 60);
  return slotMinutes <= currentMinutes && slotMinutes + BASE_SLOT_DURATION > currentMinutes;
}

export function isSlotInPast(slot: number, date: Date): boolean {
  const dateAtMidnight = new Date(date);
  const todayAtMidnight = new Date();
  todayAtMidnight.setHours(0, 0, 0, 0);
  dateAtMidnight.setHours(0, 0, 0, 0);
  const slotMinutes = slot + dateAtMidnight.getTime() / (1000 * 60);
  const currentSlotMinutes = getCurrentSlot() + todayAtMidnight.getTime() / (1000 * 60);
  return slotMinutes < currentSlotMinutes;
}

export function isBookingOngoing({date, machine, slotStart}: BookingData): boolean {
  const dateAtMidnight = new Date(date);
  dateAtMidnight.setHours(0, 0, 0, 0);
  const slotMinutes = slotStart + dateAtMidnight.getTime() / (1000 * 60);
  const currentMinutes = new Date().getTime() / (1000 * 60);
  return slotMinutes <= currentMinutes && slotMinutes + machine.slotDuration > currentMinutes;
}

export function isBookingInPast({date, machine, slotStart}: BookingData): boolean {
  const dateAtMidnight = new Date(date);
  dateAtMidnight.setHours(0, 0, 0, 0);
  const slotMinutes = slotStart + dateAtMidnight.getTime() / (1000 * 60);
  const currentMinutes = new Date().getTime() / (1000 * 60);
  return slotMinutes + machine.slotDuration <= currentMinutes;
}
