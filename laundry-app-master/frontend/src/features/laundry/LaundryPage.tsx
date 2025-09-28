import Layout from "../../components/layout/Layout.tsx";
import {useBookingsAfterToday, useMachines} from "./queries.ts";
import NextFreeSlots from "./components/NextFreeSlots.tsx";
import UserBookings from "./components/UserBookings.tsx";
import {LaundryTable} from "./components/LaundryTable.tsx";

export default function LaundryPage() {
  const machinesQuery = useMachines();
  const bookingsQuery = useBookingsAfterToday()
  if (machinesQuery.isLoading || bookingsQuery.isLoading) {
    return <Layout>Loading...</Layout>;
  }
  if (machinesQuery.isError || bookingsQuery.isError
    || !machinesQuery.data || !bookingsQuery.data) {
    return <Layout>Error loading bookings or machines.</Layout>;
  }
  return (
    <Layout>
      <h2>Your Slots</h2>
      <UserBookings/>
      <h2>Next Free Slots</h2>
      <NextFreeSlots/>
      <h2>All Slots</h2>
      <LaundryTable/>
    </Layout>
  )
}
