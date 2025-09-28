import type {ReactNode} from "react";
import styles from "./BookingCard.module.css";
import clsx from "clsx";
import {type BookingData, prettifySlot} from "../models.tsx";
import {formatDateRelativeToToday} from "../../../utils.ts";
import {isBookingOngoing} from "../utils.ts";
import {MdArrowForwardIos} from "react-icons/md";

type Props = {
  booking: BookingData;
  children?: ReactNode;
}

export function BookingCard({booking, children}: Props) {
  const isOngoing = isBookingOngoing(booking);
  return (
    <div className={styles.bookingCard}>
      <div>
        <h3>{booking.machine.name}</h3>
        <div className={clsx(styles.slotText, isOngoing && styles.ongoingSlot)}>
          {prettifySlot(booking.slotStart)}
        </div>
        <div className={clsx(styles.slotEndText, "flex-text")}>
          <MdArrowForwardIos/> {prettifySlot(booking.slotStart + booking.machine.slotDuration)}
        </div>
        <strong>
          {formatDateRelativeToToday(new Date(booking.date))}
        </strong>
      </div>
      {children}
    </div>
  )
}
