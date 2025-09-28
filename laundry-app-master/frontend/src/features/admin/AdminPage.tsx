import Layout from "../../components/layout/Layout.tsx";
import {WindowedView} from "../../components/WindowedView.tsx";
import {MachineAdmin} from "./laundry/MachineAdmin.tsx";
import {SlotAdmin} from "./laundry/SlotAdmin.tsx";
import {UserAdmin} from "./user/UserAdmin.tsx";
import {RooftopAdmin} from "./rooftop/RooftopAdmin.tsx";
import {useUserData} from "../user/queries.ts";
import {Loading} from "../../components/Loading.tsx";
import {PresidiumAdmin} from "./presidium/PresidiumAdmin.tsx";

export function AdminPage() {
  const {data: user, isLoading, isError} = useUserData();
  if (isLoading) {
    return <Layout><Loading/></Layout>
  }
  if (isError || !user) {
    return <Layout>Error loading user data.</Layout>
  }
  const windows = [];
  if (user.role === 'MASTER_ADMIN') {
    windows.push({
      name: "Users",
      body: <UserAdmin />
    });
    windows.push({
      name: "Presidium",
      body: <PresidiumAdmin />
    });
  }
  if (user.role === 'MASTER_ADMIN' || user.role === 'LAUNDRY_ADMIN') {
    windows.push({
      name: "Laundry",
      body: (
        <WindowedView
          urlParam="laundry"
          windows={[
            {
              name: "Machines",
              body: <MachineAdmin/>
            },
            {
              name: "Slots",
              body: <SlotAdmin/>
            }
          ]}/>
      )
    });
  }
  if (user.role === 'MASTER_ADMIN' || user.role === 'ROOFTOP_ADMIN') {
    windows.push({
      name: "Rooftop",
      body: <RooftopAdmin />
    });
  }
  return (
    <Layout>
      <h2>Admin Dashboard</h2>
      <WindowedView
        urlParam="section"
        windows={windows}/>
    </Layout>
  )
}
