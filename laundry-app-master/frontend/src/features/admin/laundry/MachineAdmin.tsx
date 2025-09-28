import {useCreateMachine, useDeleteMachine, useMachines} from "../../laundry/queries.ts";
import {Loading} from "../../../components/Loading.tsx";
import {Form} from "../../../components/Form.tsx";
import type {Machine} from "../../laundry/models.tsx";
import {Separator} from "../../../components/Separator.tsx";
import styles from './MachineAdmin.module.css';
import {Button} from "../../../components/Button.tsx";
import {Card} from "../../../components/Card.tsx";

export function MachineAdmin() {
  const {data: machines, isError} = useMachines();
  const {mutate: createMachine} = useCreateMachine();
  const {mutate: deleteMachine} = useDeleteMachine();
  if (isError) {
    return <div>Error loading machines.</div>;
  }
  if (!machines) {
    return <Loading/>;
  }
  const handleDelete = async (machine: Machine) => {
    if (!confirm(`Are you sure you want to delete machine "${machine.name}"? This action cannot be undone.`)) {
      return;
    }
    deleteMachine(machine.name);
  }
  return (
    <>
      <h2>Machines</h2>
      <div className={styles.machineContainer}>
        {machines.map(machine => (
          <Card
            key={machine.name}
            title={machine.name}
            data={machine}
            columns={{
              except: ['name']
            }}
          >
            <Button variant="danger" onClick={() => handleDelete(machine)}>
              Delete Machine
            </Button>
          </Card>
        ))}
      </div>
      <Separator/>
      <Form<Machine>
        title="Add Machine"
        inputs={{
          name: {
            placeholder: 'Machine Name',
            type: 'text',
          },
          type: {
            placeholder: 'Machine Type',
            options: [
              {label: 'Washing Machine', key: 'WASHER'},
              {label: 'Dryer', key: 'DRYER'},
            ]
          },
          slotDuration: {
            placeholder: 'Slot Duration (Minutes)',
            type: 'number',
          }
        }}
        submit={{
          label: 'Add Machine',
          buttonProps: {
            variant: 'primary',
          },
          onSubmit: (machine, setMessage) =>
            createMachine(machine, {
              onError: (error) => {
                setMessage({type: 'error', text: error.message})
              },
              onSuccess: () => {
                setMessage({type: 'success', text: 'Machine created successfully.'})
              }
            })
        }}
        center
      />
    </>
  )
}
