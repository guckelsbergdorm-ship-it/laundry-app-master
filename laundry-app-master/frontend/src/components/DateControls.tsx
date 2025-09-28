import {Button} from "./Button.tsx";
import {FaChevronLeft, FaChevronRight} from "react-icons/fa6";
import {prettifyWeekday} from "../utils.ts";
import styles from "./DateControls.module.css";

type Props = {
  date: Date,
  setDate: (date: Date) => void
  onDateChange?: (date: Date) => void
  variant: 'daily' | 'monthly'
}

const msPerDay = 24 * 60 * 60 * 1000;

export function DateControls({date, setDate: setDateInternal, onDateChange, variant}: Props) {
  const setDate = (newDate: Date) => {
    setDateInternal(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  }
  const moveDate = (delta: number) => {
    const factor = variant === 'daily' ? 1 : 30;
    const newDate = new Date(date.getTime() + delta * factor * msPerDay);
    setDate(newDate);
  }
  const current = variant === 'daily'
    ? (
      <>
        {date.toLocaleDateString("en")}
        <div className={styles.dateWeekday}>
          ({prettifyWeekday(date)})
        </div>
      </>
    )
    : (
      <>
        {date.toLocaleDateString("en", {month: 'long', year: 'numeric'})}
      </>
    );
  return (
    <div className={styles.dateControls}>
      <Button onClick={() => moveDate(-1)}>
        <FaChevronLeft size={16}/>
      </Button>
      <Button
        variant="empty"
        onClick={() => setDate(new Date())}
      >
        {current}
      </Button>
      <Button onClick={() => moveDate(1)}>
        <FaChevronRight size={16}/>
      </Button>
    </div>
  )
}
