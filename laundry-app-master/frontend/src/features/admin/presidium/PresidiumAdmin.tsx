import {WindowedView} from "../../../components/WindowedView.tsx";
import {ManagePresidium} from "./ManagePresidium.tsx";
import {PresidiumForm} from "./PresidiumForm.tsx";

export function PresidiumAdmin() {
  return (
    <WindowedView
      urlParam="presidium"
      windows={[
        {
          name: 'Manage Members',
          body: <ManagePresidium/>
        },
        {
          name: 'Add Member',
          body: <PresidiumForm/>
        }
      ]}
    />
  );
}