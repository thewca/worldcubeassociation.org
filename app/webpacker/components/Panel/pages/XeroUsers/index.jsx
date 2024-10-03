import React, { useState } from 'react';
import {
  Button, Form, Icon, Modal, Table,
} from 'semantic-ui-react';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { wfcXeroUsersUrl } from '../../../../lib/requests/routes.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import useSaveAction from '../../../../lib/hooks/useSaveAction';

export default function XeroUsers() {
  const {
    data, loading, error, sync,
  } = useLoadedData(wfcXeroUsersUrl);
  const { save, saving } = useSaveAction();
  const [modalParams, setModalParams] = useState({
    isOpen: false,
  });

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
            <Table.HeaderCell>Action</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data?.map((xeroUser) => (
            <Table.Row key={xeroUser.id}>
              <Table.Cell>{xeroUser.name}</Table.Cell>
              <Table.Cell>{xeroUser.email}</Table.Cell>
              <Table.Cell>{xeroUser.is_combined_invoice ? 'Yes' : 'No'}</Table.Cell>
              <Table.Cell>
                <Icon
                  name="edit"
                  link
                  onClick={() => setModalParams({
                    isOpen: true,
                    action: 'edit',
                    xeroUser,
                  })}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Button onClick={() => setModalParams({ isOpen: true, action: 'create' })}>
        New Xero User
      </Button>
      <Modal open={modalParams.isOpen} onClose={() => setModalParams({ isOpen: false })}>
        <Modal.Header>
          {modalParams.action === 'edit' ? 'Edit Xero User' : 'Create Xero User'}
        </Modal.Header>
        <Modal.Content>
          <Form onSubmit={(event) => {
            const formData = Object.fromEntries(new FormData(event.target));
            if (Object.hasOwnProperty.call(formData, 'is_combined_invoice')) {
              formData.is_combined_invoice = true;
            } else {
              formData.is_combined_invoice = false;
            }
            save(
              modalParams.action === 'edit' ? `${wfcXeroUsersUrl}/${modalParams.xeroUser.id}` : wfcXeroUsersUrl,
              formData,
              () => {
                setModalParams({ isOpen: false });
                sync();
              },
              { method: modalParams.action === 'edit' ? 'PATCH' : 'POST' },
            );
          }}
          >
            <Form.Input
              label="Name"
              placeholder="Name"
              name="name"
              defaultValue={modalParams.xeroUser?.name}
            />
            <Form.Input
              label="Email"
              placeholder="Email"
              name="email"
              defaultValue={modalParams.xeroUser?.email}
            />
            <Form.Checkbox
              label="Is Combined Invoice"
              name="is_combined_invoice"
              defaultChecked={modalParams.xeroUser?.is_combined_invoice}
            />
            <Form.Button
              type="submit"
            >
              Submit
            </Form.Button>
            <Form.Button
              onClick={() => setModalParams({ isOpen: false })}
            >
              Cancel
            </Form.Button>
          </Form>
        </Modal.Content>
      </Modal>
    </>
  );
}
