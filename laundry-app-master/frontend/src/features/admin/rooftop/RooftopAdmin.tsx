import {WindowedView} from "../../../components/WindowedView.tsx";
import {ManageRequests} from "./ManageRequests.tsx";
import {ManageBookings} from "./ManageBookings.tsx";

export function RooftopAdmin() {
  return (
    <WindowedView
      urlParam="rooftop"
      windows={[
        {
          name: "Manage Requests",
          body: <ManageRequests />,
        },
        {
          name: "Booking History",
          body: <ManageBookings />,
        }
      ]}
    />
  )
}
