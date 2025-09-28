import {RooftopForm} from "./components/RooftopForm.tsx";
import {useParams} from "react-router";
import Layout from "../../components/layout/Layout.tsx";

export function RooftopFormPage() {
  const {date} = useParams<{date: string}>();
  if (!date) {
    return <div>Date not given.</div>;
  }
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return <div>Invalid date.</div>;
  }
  return (
    <Layout>
      <RooftopForm date={parsedDate} />
    </Layout>
  )
}
