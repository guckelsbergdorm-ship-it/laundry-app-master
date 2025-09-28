import {WindowedView} from "../../components/WindowedView.tsx";
import {LaundryHistory} from "../laundry/components/LaundryHistory.tsx";
import Layout from "../../components/layout/Layout.tsx";

export function HistoryPage() {
  return (
    <Layout>
      <WindowedView
        windows={[
          {
            name: "Laundry History",
            body: <LaundryHistory />,
          },
          {
            name: "Rooftop History",
            body: <div>Rooftop Booking History coming soon...</div>
          }
        ]}
      />
    </Layout>
  )
}
