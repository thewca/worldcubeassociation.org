import React from 'react';
import {
  Button, Form, Modal, Table,
} from 'semantic-ui-react';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import { wfcXeroUsersUrl } from '../../../lib/requests/routes.js.erb';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';
import useSaveAction from '../../../lib/hooks/useSaveAction';

export default function XeroUsers() {
  const {
    data, loading, error, sync,
  } = useLoadedData(wfcXeroUsersUrl);
  const { save, saving } = useSaveAction();
  const [open, setOpen] = React.useState(false);

  if (loading || saving) return <Loading />;
  if (error) return <Errored />;
  return (
    <>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Is Combined Invoice</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data?.map((xeroUser) => (
            <Table.Row key={xeroUser.id}>
              <Table.Cell>{xeroUser.name}</Table.Cell>
              <Table.Cell>{xeroUser.email}</Table.Cell>
              <Table.Cell>{xeroUser.is_combined_invoice ? 'Yes' : 'No'}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Button onClick={() => setOpen(true)}>New Xero User</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Modal.Header>New Xero User</Modal.Header>
        <Modal.Content>
          <Form onSubmit={(event) => {
            const formData = Object.fromEntries(new FormData(event.target));
            if (Object.hasOwnProperty.call(formData, 'is_combined_invoice')) {
              formData.is_combined_invoice = true;
            } else {
              formData.is_combined_invoice = false;
            }
            save(
              wfcXeroUsersUrl,
              formData,
              () => {
                setOpen(false);
                sync();
              },
              { method: 'POST' },
            );
          }}
          >
            <Form.Input
              label="Name"
              placeholder="Name"
              name="name"
            />
            <Form.Input
              label="Email"
              placeholder="Email"
              name="email"
            />
            <Form.Checkbox
              label="Is Combined Invoice"
              name="is_combined_invoice"
            />
            <Form.Button
              type="submit"
            >
              Submit
            </Form.Button>
            <Form.Button
              onClick={() => setOpen(false)}
            >
              Cancel
            </Form.Button>
          </Form>
        </Modal.Content>
      </Modal>
    </>
  );
}
