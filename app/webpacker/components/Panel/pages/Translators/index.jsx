import React, { useState } from 'react';
import {
  Button, Form, Header, Modal, Table,
} from 'semantic-ui-react';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import useSaveAction from '../../../../lib/hooks/useSaveAction';
import WcaSearch from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';

export default function Translators() {
  const {
    data: translators, loading: translatorsLoading, error: translatorsError, sync,
  } = useLoadedData(
    apiV0Urls.userRoles.list({ groupType: groupTypes.translators, isActive: true }, 'name'),
  );
  const {
    data: locales, loading: loadingLocales, error: errorLocales,
  } = useLoadedData(apiV0Urls.userGroups.list(groupTypes.translators, 'name', { isActive: true }));
  const { save, saving } = useSaveAction();
  const [openModal, setOpenModal] = useState(false);
  const [newTranslator, setNewTranslator] = useState({});
  const [formError, setFormError] = useState(null);
  const loading = translatorsLoading || loadingLocales;
  const error = translatorsError || errorLocales || formError;

  const handleFormChange = (_, { name, value }) => setNewTranslator(
    { ...newTranslator, [name]: value },
  );

  function handleEndRole(translator) {
    save(apiV0Urls.userRoles.delete(translator.id), {}, sync, { method: 'DELETE' });
  }

  if (loading || saving) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      <Header as="h2">Active translators</Header>
      <Button onClick={() => setOpenModal(true)}>Add Translator</Button>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Locale</Table.HeaderCell>
            <Table.HeaderCell>Translator</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {translators.map((translator) => (
            <Table.Row>
              <Table.Cell>{translator.group.metadata.locale}</Table.Cell>
              <Table.Cell>{translator.user.name}</Table.Cell>
              <Table.Cell>
                <Button onClick={() => handleEndRole(translator)}>End Role</Button>
              </Table.Cell>
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
            setNewTranslator({});
          }}
        >
          <Modal.Content>
            <Header>Add Translator</Header>
            <Form onSubmit={() => {
              save(apiV0Urls.userRoles.create(), {
                groupId: newTranslator.groupId,
                userId: newTranslator.user.id,
              }, () => {
                sync();
                setNewTranslator({});
                setOpenModal(false);
              }, { method: 'POST' }, (err) => {
                setFormError(err);
                setNewTranslator({});
                setOpenModal(false);
              });
            }}
            >
              <Form.Field
                label="Locale"
                control={Form.Select}
                name="groupId"
                value={newTranslator.groupId}
                onChange={handleFormChange}
                options={locales.map((locale) => ({
                  key: locale.id,
                  text: locale.name,
                  value: locale.id,
                }))}
              />
              <Form.Field
                label="New Translator"
                control={WcaSearch}
                name="user"
                value={newTranslator.user}
                onChange={handleFormChange}
                model={SEARCH_MODELS.user}
                multiple={false}
              />
              <Button type="submit">Submit</Button>
            </Form>
          </Modal.Content>
        </Modal>
      )}
    </>
  );
}
