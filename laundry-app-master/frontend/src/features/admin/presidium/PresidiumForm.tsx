import {Form} from "../../../components/Form.tsx";
import type {PresidiumMember} from "../../presidium/models.ts";
import {useCreatePresidiumMember, useUpdatePresidiumMember} from "../../presidium/queries.ts";

type PresidiumFormValues = Omit<PresidiumMember, 'visible' | 'displayOrder'> & {
  visible: string;
  displayOrder: number | string;
};

export function PresidiumForm({variant = 'create', member}: {variant?: 'create' | 'edit', member?: PresidiumMember}) {
  const {mutate: createMember} = useCreatePresidiumMember();
  const {mutate: updateMember} = useUpdatePresidiumMember();

  const initialValue: Partial<PresidiumFormValues> = member
    ? {
      ...member,
      visible: member.visible ? 'true' : 'false',
      displayOrder: member.displayOrder,
    }
    : {visible: 'true', displayOrder: 0};

  return (
    <Form<PresidiumFormValues>
      title={variant === 'create' ? 'Add Presidium Member' : 'Edit Presidium Member'}
      value={initialValue}
      inputs={{
        name: {
          label: 'Name',
          type: 'text',
        },
        title: {
          label: 'Role / Title',
          type: 'text',
        },
        contact: {
          label: 'Contact (optional)',
          type: 'text',
          optional: true,
        },
        portraitUrl: {
          label: 'Portrait URL (optional)',
          type: 'text',
          optional: true,
        },
        bio: {
          label: 'Bio (optional)',
          type: 'textarea',
          optional: true,
        },
        displayOrder: {
          label: 'Display Order',
          type: 'number',
        },
        visible: {
          label: 'Visibility',
          options: [
            {key: 'true', label: 'Visible'},
            {key: 'false', label: 'Hidden'}
          ]
        }
      }}
      submit={{
        label: variant === 'create' ? 'Add Member' : 'Update Member',
        buttonProps: {
          variant: variant === 'create' ? 'primary' : 'secondary',
        },
        onSubmit: (values, setMessage) => {
          const payload = {
            name: values.name,
            title: values.title,
            contact: values.contact || undefined,
            portraitUrl: values.portraitUrl || undefined,
            bio: values.bio || undefined,
            displayOrder: values.displayOrder !== undefined && values.displayOrder !== null
              ? Number(values.displayOrder)
              : undefined,
            visible: values.visible === 'true'
          };

          if (variant === 'create') {
            createMember(payload, {
              onSuccess: () => setMessage({type: 'success', text: 'Presidium member created.'}),
              onError: (error) => setMessage({type: 'error', text: error.message})
            });
          } else if (member) {
            updateMember({id: member.id, ...payload}, {
              onSuccess: () => setMessage({type: 'success', text: 'Presidium member updated.'}),
              onError: (error) => setMessage({type: 'error', text: error.message})
            });
          }
        }
      }}
      center
    />
  );
}