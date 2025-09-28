import {Form} from "../../../components/Form.tsx";
import type {RooftopBookingRequest} from "../models.ts";
import {toLocalDate} from "../../../utils.ts";
import {useQueryClient} from "@tanstack/react-query";

export function RooftopForm({date}: { date: Date }) {
  const qc = useQueryClient();
  return (
    <Form<RooftopBookingRequest>
      center
      title="Request Rooftop Access"
      inputs={{
        date: {
          label: "Date",
          value: toLocalDate(date)
        },
        contact: {
          label: "Contact Information",
          placeholder: "E-mail or Phone Number"
        },
        reason: {
          label: "Reason for Booking",
          placeholder: "Party, Meeting, etc.",
          type: "textarea"
        },
        timeSpan: {
          label: "Time Span",
          placeholder: "20:00 onwards, whole day, etc."
        },

      }}
      submit={{
        label: "Submit Request",
        buttonProps: {
          variant: "primary",
        },
        postUrl: "/api/rooftop/bookings/requests",
        redirectUrl: "/rooftop/bookings",
        onResult: (res, setMessage) => {
          if (res.ok) {
            qc.invalidateQueries({queryKey: ['rooftopRequests']}).then();
            qc.invalidateQueries({queryKey: ['adminRooftopRequests']}).then();
            setMessage({
              type: "success",
              text: "Request submitted successfully. " +
                "You will be notified via the contact information you gave once it is approved."
            });
          }
          return false; // Don't consume
        }
      }}
    />
  )
}
