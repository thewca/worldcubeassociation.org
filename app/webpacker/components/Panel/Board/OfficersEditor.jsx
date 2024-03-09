import React, { useState } from 'react';
import {
  Button, Form, Header, Modal, Table,
} from 'semantic-ui-react';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../lib/requests/routes.js.erb';
import { groupTypes, officersStatus } from '../../../lib/wca-data.js.erb';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';
import I18n from '../../../lib/i18n';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import WcaSearch from '../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../SearchWidget/SearchModel';

const officersStatusOptions = Object.keys(officersStatus).map((option) => ({
  key: option,
  text: I18n.t(`user_roles.status.officers.${option}`),
  value: option,
}));

const initialOfficerValue = {
  status: officersStatusOptions[0].value,
};

export default function OfficersEditor() {
  const {
    data: officers, loading: officersLoading, error: officersError, sync,
  } = useLoadedData(
    apiV0Urls.userRoles.listOfGroupType(groupTypes.officers, 'status', {
      isActive: true,
    }),
  );
  const [openModal, setOpenModal] = useState(false);
  const [newOfficer, setNewOfficer] = useState(initialOfficerValue);
  const [formError, setFormError] = useState(null);
  const { save, saving } = useSaveAction();
  const error = officersError || formError;

  const handleFormChange = (_, { name, value }) => setNewOfficer(
    { ...newOfficer, [name]: value },
  );

  if (officersLoading || saving) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      <Header>Officers Editor</Header>
      <Button onClick={() => setOpenModal(true)}>Add Role</Button>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {officers.map((officer) => (
            <Table.Row key={officer.id}>
              <Table.Cell>{officer.user.name}</Table.Cell>
              <Table.Cell>{I18n.t(`user_roles.status.officers.${officer.metadata.status}`)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {openModal && (
        <Modal
          size="fullscreen"
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setNewOfficer(initialOfficerValue);
          }}
        >
          <Modal.Content>
            <Header>Add Officer</Header>
            <Form onSubmit={() => {
              save(apiV0Urls.userRoles.create(), {
                groupType: groupTypes.officers,
                userId: newOfficer.user.id,
                status: newOfficer.status,
              }, () => {
                sync();
                setNewOfficer(initialOfficerValue);
                setOpenModal(false);
              }, { method: 'POST' }, (err) => {
                setFormError(err);
                setNewOfficer(initialOfficerValue);
                setOpenModal(false);
              });
            }}
            >
              <Form.Field
                label="New Officer"
                control={WcaSearch}
                name="user"
                value={newOfficer.user}
                onChange={handleFormChange}
                model={SEARCH_MODELS.user}
                multiple={false}
              />
              <Form.Dropdown
                label="Status"
                name="status"
                value={newOfficer.status}
                onChange={handleFormChange}
                options={officersStatusOptions}
              />
              <Button type="submit">Submit</Button>
            </Form>
          </Modal.Content>
        </Modal>
      )}
    </>
  );
}
