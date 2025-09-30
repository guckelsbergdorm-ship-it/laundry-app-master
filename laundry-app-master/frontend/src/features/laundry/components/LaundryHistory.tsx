import {PageControls} from "../../../components/PageControls.tsx";
import {useState} from "react";
import {useUserBookings} from "../queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import {Card} from "../../../components/Card.tsx";
import {iconOfMachineType, prettifySlot} from "../models.tsx";

export function LaundryHistory() {
  const [page, setPage] = useState(0);
  const {data: bookings, isLoading, isError} = useUserBookings(page, 20);
  if (isLoading) {
    return <Loading/>;
  }
  if (isError || !bookings) {
    return <>Error loading bookings.</>;
  }
  return (
    <div>
      <PageControls page={page} setPage={setPage} array={bookings}/>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {bookings.map((booking, i) => (
          <Card
            key={i}
            data={booking}
            title={
              <div className="flex-text">
                {iconOfMachineType(booking.machine.type)} {booking.machine.name}
              </div>
            }
            columns={[
              [
                {
                  key: 'date',
                  valueRender: (date) => new Date(date as string).toLocaleDateString('de-DE')
                },
                {
                  key: 'slotStart',
                  valueRender: (slot) => prettifySlot(Number(slot))
                }
              ]
            ]}
          />
        ))}
      </div>
    </div>
  )
}
