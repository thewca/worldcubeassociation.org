import React from 'react';
import {
  Button, Form, Modal, Table,
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
  const [formData, setFormData] = React.useState({ redirectType: 'country' });

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
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data?.map((duesRedirect) => (
            <Table.Row key={duesRedirect.id}>
              <Table.Cell>{duesRedirect.redirect_type}</Table.Cell>
              <Table.Cell>
                {
                duesRedirect.redirect_type === 'country'
                  ? duesRedirect.redirect_from_country.name
                  : duesRedirect.redirect_from_organizer.name
                }
              </Table.Cell>
              <Table.Cell>{duesRedirect.redirect_to.name}</Table.Cell>
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
              name="redirect_type"
              options={[
                { key: 'country', text: 'Country', value: 'country' },
                { key: 'organizer', text: 'Organizer', value: 'organizer' },
              ]}
              value={formData.redirectType}
              onChange={(e, { value }) => setFormData({ ...formData, redirectType: value })}
            />
            {formData.redirectType === 'country' && (
              <CountrySelector
                label="From"
                name="redirect_from_country_id"
                value={formData.redirectFromCountryIso2}
                onChange={
                  (e, { value }) => setFormData({ ...formData, redirectFromCountryIso2: value })
                }
              />
            )}
            {formData.redirectType === 'organizer' && (
              <WcaSearch
                selectedValue={formData.redirectFromOrganizer}
                setSelectedValue={
                  (value) => setFormData({ ...formData, redirectFromOrganizer: value })
                }
                multiple={false}
                model="user"
              />
            )}
            <Form.Select
              label="To"
              placeholder="To"
              name="redirect_to"
              options={xeroUsersFetch.data.map((xeroUser) => ({
                key: xeroUser.id,
                text: xeroUser.name,
                value: xeroUser.id,
              }))}
              value={formData.redirectTo}
              onChange={(e, { value }) => setFormData({ ...formData, redirectToId: value })}
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
