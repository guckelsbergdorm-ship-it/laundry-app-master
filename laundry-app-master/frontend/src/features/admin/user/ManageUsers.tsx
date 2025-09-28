import {useAllUsers, useDeleteUser} from "../../user/queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import {Card} from "../../../components/Card.tsx";
import {Button} from "../../../components/Button.tsx";
import {useMemo, useState} from "react";
import {Separator} from "../../../components/Separator.tsx";
import Popup from "reactjs-popup";
import {UserForm} from "./UserForm.tsx";
import {ROLES, type Role} from "../../user/models.ts";

export function ManageUsers() {
  const {data: users, isLoading, isError} = useAllUsers();
  const {mutateAsync: deleteUser} = useDeleteUser();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  if (isLoading) {
    return <Loading/>;
  }
  if (isError || !users) {
    return <div>Error loading users</div>;
  }
  const countsByRole = useMemo(() => {
    const record = new Map<Role, number>();
    for (const role of ROLES) {
      record.set(role, 0);
    }
    for (const user of users) {
      record.set(user.role, (record.get(user.role) ?? 0) + 1);
    }
    return record;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => (search ? user.roomNumber.toLowerCase().includes(search.toLowerCase()) : true))
      .filter(user => roleFilter === 'ALL' || user.role === roleFilter)
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, {numeric: true, sensitivity: 'base'}));
  }, [users, search, roleFilter]);
  return (
    <>
      <h2>Users</h2>
      <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
        <div className="form-input">
          <input
            type="text"
            placeholder="Search users by room number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="form-input" style={{maxWidth: '320px'}}>
          <select
            value={roleFilter}
            onChange={event => setRoleFilter(event.target.value as 'ALL' | Role)}
            style={{
              width: '100%',
              padding: 'var(--padding)',
              borderRadius: '8px',
              border: '1px solid var(--clr-surface-tonal-a50)',
              fontWeight: 500
            }}
          >
            <option value="ALL">All roles</option>
            {ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
        <strong>Total: {users.length}</strong>
        {ROLES.map(role => (
          <span key={role} style={{background: 'var(--clr-surface-tonal-a20)', padding: '0.2rem 0.6rem', borderRadius: '999px'}}>
            {role}: {countsByRole.get(role) ?? 0}
          </span>
        ))}
      </div>
      <Separator/>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      }}>
        {filteredUsers
          .map(user => (
            <Card
              key={user.roomNumber}
              title={user.roomNumber}
              data={user}
              columns={{
                except: ['roomNumber']
              }}
            >
              <div className="button-container">
                <Popup
                  modal
                  position="center center"
                  trigger={
                    <Button variant="secondary">
                      Edit User
                    </Button>
                  }
                >
                  <UserForm variant="edit" user={user}/>
                </Popup>
                <Button
                  variant="danger"
                  onClick={async () => {
                    if (!confirm(`Are you sure you want to delete user "${user.roomNumber}"? This action cannot be undone.`)) {
                      return;
                    }
                    await deleteUser(user.roomNumber);
                  }}
                >
                  Delete User
                </Button>
              </div>
            </Card>
          ))}
      </div>
    </>
  )
}
