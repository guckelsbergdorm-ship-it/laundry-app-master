import {WindowedView} from "../../../components/WindowedView.tsx";
import {ManageUsers} from "./ManageUsers.tsx";
import {UserForm} from "./UserForm.tsx";
import {BulkGenerateUsers} from "./BulkGenerateUsers.tsx";

export function UserAdmin() {
  return (
    <WindowedView
      urlParam="user"
      windows={[
        {
          name: "Manage Users",
          body: <ManageUsers/>
        },
        {
          name: "Bulk Generate",
          body: <BulkGenerateUsers/>
        },
        {
          name: "Add User",
          body: <UserForm/>
        }
      ]}/>
  )
}
