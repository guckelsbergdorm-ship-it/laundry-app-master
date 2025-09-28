import {useState} from "react";
import {DateControls} from "../../../components/DateControls.tsx";
import styles from './RooftopTable.module.css';
import clsx from "clsx";
import {isDayInPast, isDaySame, isDayToday} from "../utils.ts";
import {useBookingsByMonth, useMyBookingRequests} from "../queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import type {RooftopBooking} from "../models.ts";
import {FiExternalLink} from "react-icons/fi";
import {useNavigate} from "react-router";
import {toLocalDate} from "../../../utils.ts";

function renderCell(
  day: number | null,
  date: Date,
  hoveredDay: number | null,
  booking?: RooftopBooking,
  isRequested?: boolean,
) {
  if (day === null) {
    return <div className={clsx(styles.day, styles.pastDay)}/>;
  }
  const isPast = isDayInPast(day, date.getMonth(), date.getFullYear());
  const isToday = isDayToday(day, date.getMonth(), date.getFullYear());
  const isBooked = !!booking;
  return (
    <div
      className={clsx(
        styles.day,
        isBooked && styles.bookedDay,
        isPast && styles.pastDay,
        isToday && styles.today,
        hoveredDay === day && styles.hoveredDay,
        isRequested && !isBooked && styles.requestedDay,
      )}
    >
      {day}
      <div className={styles.hoveredText}>
        {booking ? (
          <>
            {booking.bookerRoomNumber}
          </>
        ) : isRequested
          ? (
            <div className="flex-text">
              Requested
            </div>
          ) : (
            <div className="flex-text">
              Book <FiExternalLink/>
            </div>
          )}
      </div>
    </div>
  );
}

export function RooftopTable() {
  const [date, setDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const {data: bookings, isLoading, isError} = useBookingsByMonth(date);
  const {data: requests} = useMyBookingRequests({
    status: 'REQUESTED'
  });
  const navigate = useNavigate();

  if (isLoading) {
    return <Loading/>;
  }

  if (isError || !bookings) {
    return <div>Error loading bookings</div>;
  }

  const dayToBooking = new Map<number, RooftopBooking>();
  bookings.forEach(booking => {
    const day = new Date(booking.date).getDate();
    dayToBooking.set(day, booking);
  });

  const year = date.getFullYear();
  const monthIndex = date.getMonth();

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startWeekday = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeks: (number | null)[][] = [];
  const offset = startWeekday === 0 ? 6 : startWeekday - 1;
  let day = 1 - offset;
  while (day <= daysInMonth) {
    const week: (number | null)[] = [];
    for (let i = 0; i < 7; i++, day++) {
      week.push(day > 0 && day <= daysInMonth ? day : null);
    }
    weeks.push(week);
  }


  return (
    <div className={styles.container}>
      <DateControls
        date={date}
        setDate={setDate}
        variant="monthly"
      />
      <div className={styles.gridContainer}>
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${weekdays.length}, minmax(var(--day-col-width), 1fr))`,
            gridTemplateRows: `var(--header-row-height) repeat(${weeks.length}, var(--day-row-height))`,
          }}
        >
          {weekdays.map((weekday, i) => (
            <div
              key={weekday}
              className={clsx(
                styles.weekdayHeader,
                i === weekdays.length - 1 && styles.lastInRow,
              )}
              style={{gridRow: 1, gridColumn: i + 1}}
            >
              {weekday}
            </div>
          ))}
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const isRequested = day
                ? requests?.some(r =>
                  isDaySame(day, date.getMonth(), date.getFullYear(), new Date(r.date)))
                : false;
              const booking = day ? dayToBooking.get(day) : undefined;
              const isPast = day ? !isDayInPast(day, date.getMonth(), date.getFullYear()) : true;
              return (
                <div
                  key={`${wi}-${di}`}
                  className={clsx(styles.dayCell)}
                  style={{gridRow: wi + 2, gridColumn: di + 1}}
                  {...(day !== null
                    && !isRequested
                    && isPast
                    && !booking
                    && {
                      onMouseEnter: () => setHoveredDay(day),
                      onMouseLeave: () => setHoveredDay(null),
                      onClick: () =>
                        navigate(`/rooftop/bookings/request/${
                          toLocalDate(new Date(date.getFullYear(), date.getMonth(), day))
                        }`)
                    })}
                >
                  {renderCell(day, date, hoveredDay, day ? booking : undefined, isRequested)}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
