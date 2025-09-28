import {useNavigate} from "react-router";
import {useQueryClient} from "@tanstack/react-query";
import {invalidateUserData} from "./queries.ts";
import {fetchWithCredentials} from "../../utils.ts";

export default function LogoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  fetchWithCredentials(`/auth/logout`, {
    method: 'POST',
  }).then(res => {
    if (!res.ok) {
      navigate('/');
      alert('Failed to log out: ' + res.statusText);
    } else {
      invalidateUserData(queryClient);
      navigate('/');
    }
  });
  return null;
}
