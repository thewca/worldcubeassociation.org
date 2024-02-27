import React from 'react';
import {
  Button, Confirm, Form, Icon, Modal, Table,
} from 'semantic-ui-react';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import { wfcDuesRedirectsUrl, wfcXeroUsersUrl } from '../../../lib/requests/routes.js.erb';
import Errored from '../../Requests/Errored';
import Loading from '../../Requests/Loading';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import CountrySelector from '../../CountrySelector/CountrySelector';
import WcaSearch from '../../SearchWidget/WcaSearch';

export default function DuesRedirect() {
  const {
    data, loading, error, sync,
  } = useLoadedData(wfcDuesRedirectsUrl);
  const xeroUsersFetch = useLoadedData(wfcXeroUsersUrl);
  const { save, saving } = useSaveAction();
  const [open, setOpen] = React.useState(false);
  const [toDeleteId, setToDeleteId] = React.useState();
  const [formData, setFormData] = React.useState({ redirectType: 'Country' });

  const handleFormChange = (_, { name, value }) => setFormData({ ...formData, [name]: value });

  if (loading || saving || xeroUsersFetch.loading) return <Loading />;
  if (error || xeroUsersFetch.err) return <Errored />;
  return (
    <>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Type</Table.HeaderCell>
            <Table.HeaderCell>From</Table.HeaderCell>
            <Table.HeaderCell>To</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data?.map((duesRedirect) => (
            <Table.Row key={duesRedirect.id}>
              <Table.Cell>{duesRedirect.redirect_source_type}</Table.Cell>
              <Table.Cell>{duesRedirect.redirect_source.name}</Table.Cell>
              <Table.Cell>{duesRedirect.redirect_to.name}</Table.Cell>
              <Table.Cell>
                <Icon
                  name="trash"
                  link
                  onClick={() => setToDeleteId(duesRedirect.id)}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Button onClick={() => setOpen(true)}>New Dues Redirect</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Modal.Header>New Dues Redirect</Modal.Header>
        <Modal.Content>
          <Form onSubmit={() => {
            save(
              wfcDuesRedirectsUrl,
              {
                ...formData,
                redirectFromOrganizerId: formData.redirectFromOrganizer?.id,
              },
              () => {
                setOpen(false);
                sync();
              },
              { method: 'POST' },
            );
          }}
          >
            <Form.Select
              label="Type"
              placeholder="Type"
              name="redirectType"
              options={[
                { key: 'country', text: 'Country', value: 'Country' },
                { key: 'organizer', text: 'Organizer', value: 'User' },
              ]}
              value={formData.redirectType}
              onChange={handleFormChange}
            />
            {formData.redirectType === 'Country' && (
              <CountrySelector
                label="From"
                name="redirectFromCountryIso2"
                value={formData.redirectFromCountryIso2}
                onChange={handleFormChange}
              />
            )}
            {formData.redirectType === 'User' && (
              <WcaSearch
                name="redirectFromOrganizer"
                value={formData.redirectFromOrganizer}
                onChange={handleFormChange}
                multiple={false}
                model="user"
              />
            )}
            <Form.Select
              label="To"
              placeholder="To"
              name="redirectToId"
              options={xeroUsersFetch.data.map((xeroUser) => ({
                key: xeroUser.id,
                text: xeroUser.name,
                value: xeroUser.id,
              }))}
              value={formData.redirectTo}
              onChange={handleFormChange}
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
      <Confirm
        open={toDeleteId}
        content="Are you sure you want to delete?"
        onCancel={() => setToDeleteId(null)}
        onConfirm={() => {
          const duesRedirectId = toDeleteId;
          save(
            `${wfcDuesRedirectsUrl}/${duesRedirectId}`,
            {},
            () => {
              setToDeleteId(null);
              sync();
            },
            { method: 'DELETE' },
          );
        }}
      />
    </>
  );
}
