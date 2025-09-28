import Layout from "../../components/layout/Layout.tsx";
import {Form} from "../../components/Form.tsx";
import {FaKey} from "react-icons/fa";
import {FaHouseChimney} from "react-icons/fa6";

type LoginRequest = { roomNumber: string, password: string };

export default function LoginPage() {
  return (
    <Layout>
      <Form<LoginRequest>
        title={<h2>Log In</h2>}
        inputs={{
          roomNumber: {
            label: <FaHouseChimney/>,
            placeholder: 'Room Number',
          },
          password: {
            label: <FaKey/>,
            placeholder: 'Password',
            type: 'password',
          }
        }}
        submit={{
          'label': 'Log In',
          postUrl: '/auth/login',
          redirectUrl: '/',
          buttonProps: {
            variant: 'primary',
          }
        }}
        errorFormat={err => `Login failed: ${err}`}
        center
      />
    </Layout>
  )
}
