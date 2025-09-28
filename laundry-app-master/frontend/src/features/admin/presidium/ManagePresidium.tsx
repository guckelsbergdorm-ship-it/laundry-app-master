import {useAllPresidiumMembers, useDeletePresidiumMember, useUpdatePresidiumMember} from "../../presidium/queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import {Card} from "../../../components/Card.tsx";
import {Button} from "../../../components/Button.tsx";
import Popup from "reactjs-popup";
import {PresidiumForm} from "./PresidiumForm.tsx";
import type {PresidiumMember} from "../../presidium/models.ts";

export function ManagePresidium() {
  const {data: members, isLoading, isError} = useAllPresidiumMembers();
  const {mutateAsync: deleteMember} = useDeletePresidiumMember();
  const {mutateAsync: updateMember} = useUpdatePresidiumMember();

  if (isLoading) {
    return <Loading/>;
  }

  if (isError || !members) {
    return <div>Error loading presidium members.</div>;
  }

  const handleToggleVisibility = async (member: PresidiumMember) => {
    try {
      await updateMember({
        id: member.id,
        name: member.name,
        title: member.title,
        contact: member.contact ?? undefined,
        portraitUrl: member.portraitUrl ?? undefined,
        bio: member.bio ?? undefined,
        displayOrder: member.displayOrder,
        visible: !member.visible
      });
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleDelete = async (member: PresidiumMember) => {
    if (!confirm(`Delete ${member.name}? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteMember(member.id);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  return (
    <div style={{display: 'grid', gap: '1rem'}}>
      {members.map(member => (
        <Card
          key={member.id}
          title={member.name}
          data={member}
          columns={[[
            'title',
            'contact',
            'portraitUrl',
            'displayOrder',
            {
              key: 'visible',
              label: 'Visible',
              valueRender: (value) => value ? 'Yes' : 'No'
            },
            {
              key: 'updatedAt',
              label: 'Updated',
              valueRender: (value) => new Date(value as string).toLocaleString()
            }
          ]]}
        >
          <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
            <Popup
              modal
              trigger={<Button variant="secondary">Edit</Button>}
            >
              <PresidiumForm variant="edit" member={member}/>
            </Popup>
            <Button variant="secondary" onClick={() => handleToggleVisibility(member)}>
              {member.visible ? 'Hide' : 'Show'}
            </Button>
            <Button variant="danger" onClick={() => handleDelete(member)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}