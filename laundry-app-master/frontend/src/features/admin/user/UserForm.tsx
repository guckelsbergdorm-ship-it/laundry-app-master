import {ROLES, type User} from "../../user/models.ts";
import {toTitleCase} from "../../../utils.ts";
import {Form} from "../../../components/Form.tsx";
import {useCreateUser, useUpdateUser} from "../../user/queries.ts";

export function UserForm({variant = 'create', user}: { variant?: 'create' | 'edit', user?: User}) {
  const {mutate: createUser} = useCreateUser();
  const {mutate: updateUser} = useUpdateUser();
  return (
    <Form<User>
      title={variant === 'create' ? "Add User" : "Edit User"}
      center
      value={user}
      inputs={{
        roomNumber: {
          label: 'Room Number',
          readOnly: variant === 'edit',
        },
        password: {
          label: 'Password',
          type: 'text',
          optional: variant === 'edit',
        },
        role: {
          label: 'Role',
          options: ROLES.map(role => ({
            key: role,
            label: toTitleCase((role as string).replace('_', ' '))
          })),
          optional: variant === 'edit',
        },
        ...(variant === 'edit' && ({
          maxWasherMinutesPerWeek: {
            label: 'Max Washer Minutes Per Week',
            type: 'number',
            optional: true,
          },
          maxDryerMinutesPerWeek: {
            label: 'Max Dryer Minutes Per Week',
            type: 'number',
            optional: true,
          },
        }))
      }}
      submit={
        variant === 'create' ? ({
          label: 'Add User',
          buttonProps: {
            variant: 'primary',
          },
          onSubmit: ({roomNumber, role, password}, setMessage) =>
            createUser({
              roomNumber,
              role: role,
              password: password!,
            }, {
              onError: (error) => {
                setMessage({type: 'error', text: error.message})
              },
              onSuccess: () => {
                setMessage({type: 'success', text: 'User created successfully.'})
              }
            })
        }) : ({
          label: 'Update User',
          buttonProps: {
            variant: 'secondary',
          },
          onSubmit: (user, setMessage) =>
            updateUser(user, {
              onError: (error) => {
                setMessage({type: 'error', text: error.message})
              },
              onSuccess: () => {
                setMessage({type: 'success', text: 'User updated successfully.'})
              }
            })
        })
      }
    />
  )
}
