import Layout from "../../components/layout/Layout.tsx";
import {RooftopTable} from "./components/RooftopTable.tsx";
import {RooftopHistory} from "./components/RooftopHistory.tsx";

export default function RooftopPage() {
  return (
    <Layout>
      <h2>Rooftop Bookings</h2>
      <RooftopTable />
      <RooftopHistory />
    </Layout>
  )
}
