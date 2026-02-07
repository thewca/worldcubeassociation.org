import React, { useState } from 'react';
import {
  Header, Table, Button, Modal, Form, Message, Icon,
  Segment,
} from 'semantic-ui-react';
import { apiV0Urls, editUserAvatarUrl } from '../../../../lib/requests/routes.js.erb';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import WcaSearch from '../../../SearchWidget/WcaSearch';
import I18n from '../../../../lib/i18n';
import useSaveAction from '../../../../lib/hooks/useSaveAction';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import { useConfirm } from '../../../../lib/providers/ConfirmProvider';
import { nextStatusOfGroupType, previousStatusOfGroupType, statusObjectOfGroupType } from '../../../../lib/helpers/status-objects';
import { delegateRegionsStatus } from '../../../../lib/wca-data.js.erb';
import LocationEditorModal from './LocationEditorModal';
import CreateModal from '../../views/UserRoles/CreateModal';

const delegateStatusOptions = [
  delegateRegionsStatus.trainee_delegate,
  delegateRegionsStatus.junior_delegate,
  delegateRegionsStatus.delegate,
];
const delegateStatusOptionsList = delegateStatusOptions.map((option) => ({
  text: I18n.t(`enums.user_roles.status.delegate_regions.${option}`),
  value: option,
}));
const initialValue = {
  newDelegate: null,
  status: delegateStatusOptions[0],
};

const isLead = (role) => role.metadata.status === 'leader';

const canPromote = (role) => (
  [
    statusObjectOfGroupType(role.group.group_type).trainee_delegate,
    statusObjectOfGroupType(role.group.group_type).junior_delegate,
  ].includes(role.metadata.status)
);

const canDemote = (role) => (
  [
    statusObjectOfGroupType(role.group.group_type).junior_delegate,
    statusObjectOfGroupType(role.group.group_type).delegate,
  ].includes(role.metadata.status)
);

export default function Subregion({ group }) {
  const {
    data: delegates, loading, error: delegatesFetchError, sync,
  } = useLoadedData(apiV0Urls.userRoles.list(
    {
      groupId: group.id,
      isActive: true,
      isLead: false,
    },
    'location,name',
  ));
  const [openModalType, setOpenModalType] = useState(null);
  const [delegateToChange, setDelegateToChange] = useState(null);
  const [formValues, setFormValues] = useState(initialValue);
  const [newDelegateUser, setNewDelegateUser] = useState(null);
  const [formError, setFormError] = useState(null);
  const { save, saving } = useSaveAction();
  const confirm = useConfirm();
  const error = delegatesFetchError || formError;

  const setDelegateToEditLocation = (delegate) => {
    setDelegateToChange(delegate);
    setOpenModalType('editLocation');
  };

  const handleFormChange = (_, { name, value }) => setFormValues({ ...formValues, [name]: value });

  const addNewDelegateAction = () => {
    save(
      apiV0Urls.userRoles.create(),
      {
        userId: formValues.newDelegate.id,
        groupId: group.id,
        status: formValues.status,
        location: formValues.location || '',
      },
      () => {
        sync();
        setNewDelegateUser(formValues.newDelegate);
        setFormValues(initialValue);
        setOpenModalType(null);
      },
      { method: 'POST' },
      (err) => setFormError(err),
    );
  };

  const promoteDelegateAction = (delegate) => {
    confirm({
      content: `Are you sure that you want to promote ${delegate.user.name} from ${I18n.t(`enums.user_roles.status.delegate_regions.${delegate.metadata.status}`)} to ${I18n.t(`enums.user_roles.status.delegate_regions.${nextStatusOfGroupType(delegate.metadata.status, delegate.group.group_type)}`)}?`,
    }).then(() => {
      save(
        apiV0Urls.userRoles.update(delegate.id),
        { status: nextStatusOfGroupType(delegate.metadata.status, delegate.group.group_type) },
        sync,
        { method: 'PATCH' },
        (err) => setFormError(err),
      );
    });
  };

  const demoteDelegateAction = (delegate) => {
    confirm({
      content: `Are you sure that you want to demote ${delegate.user.name} from ${I18n.t(`enums.user_roles.status.delegate_regions.${delegate.metadata.status}`)} to ${I18n.t(`enums.user_roles.status.delegate_regions.${previousStatusOfGroupType(delegate.metadata.status, delegate.group.group_type)}`)}?`,
    }).then(() => {
      save(
        apiV0Urls.userRoles.update(delegate.id),
        { status: previousStatusOfGroupType(delegate.metadata.status, delegate.group.group_type) },
        sync,
        { method: 'PATCH' },
        (err) => setFormError(err),
      );
    });
  };

  const endDelegateRoleAction = (delegate) => {
    confirm({
      content: `Are you sure that you want to end the Delegate role for ${delegate.user.name} (${I18n.t(`enums.user_roles.status.delegate_regions.${delegate.metadata.status}`)})?`,
    }).then(() => {
      save(apiV0Urls.userRoles.delete(delegate.id), {}, sync, { method: 'DELETE' });
    });
  };

  const editLocationAction = (changes) => {
    confirm({
      content: `Are you sure that you want to update the location for ${delegateToChange.user.name}?`,
    }).then(() => {
      save(apiV0Urls.userRoles.update(delegateToChange.id), changes, () => {
        sync();
        setOpenModalType(null);
      }, { method: 'PATCH' });
    });
  };

  if (loading || saving) return <Loading />;
  if (error) return <Errored />;

  return (
    <>
      {newDelegateUser && (
        <Message content={(
          <>
            {'New Delegate has been created. Please adjust the thumbnail of the new Delegate '}
            <a href={editUserAvatarUrl(newDelegateUser.id)}>here</a>
          </>
        )}
        />
      )}
      <Header as="h4">{group.name}</Header>
      {group.parent_group_id && (
        <Segment>
          Regional Delegate:
          {' '}
          <RegionalDelegate
            group={group}
            setOpenModalType={setOpenModalType}
          />
        </Segment>
      )}
      <Button onClick={() => setOpenModalType('newDelegate')}>New Delegate</Button>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Location</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {delegates.map((delegate) => (
            <Table.Row key={delegate.id}>
              <Table.Cell>{delegate.user.name}</Table.Cell>
              <Table.Cell>{I18n.t(`enums.user_roles.status.delegate_regions.${delegate.metadata.status}`)}</Table.Cell>
              <Table.Cell>{delegate.metadata.location}</Table.Cell>
              <Table.Cell>
                {canPromote(delegate)
                  && <Button onClick={() => promoteDelegateAction(delegate)}>Promote</Button>}
                {canDemote(delegate)
                  && <Button onClick={() => demoteDelegateAction(delegate)}>Demote</Button>}
                {!isLead(delegate)
                  && <Button onClick={() => endDelegateRoleAction(delegate)}>End Role</Button>}
                <Button onClick={() => setDelegateToEditLocation(delegate)}>
                  Edit Location
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <CreateModal
        open={openModalType === 'newLeadDelegate'}
        onClose={() => {
          setOpenModalType(null);
          sync();
        }}
        title="New Lead Delegate"
        groupId={group.id}
        status={(group.parent_group_id
          ? delegateRegionsStatus.regional_delegate
          : delegateRegionsStatus.senior_delegate)}
        location={group.name}
      />
      <Modal
        size="fullscreen"
        onClose={() => setOpenModalType(null)}
        open={openModalType === 'newDelegate'}
      >
        <Modal.Content>
          <Header>New Delegate</Header>
          <Form onSubmit={addNewDelegateAction}>
            <Form.Field
              label="New Delegate"
              control={WcaSearch}
              name="newDelegate"
              value={formValues?.newDelegate}
              onChange={handleFormChange}
              model={SEARCH_MODELS.user}
              multiple={false}
            />
            <Form.Dropdown
              label="Delegate Status"
              fluid
              selection
              name="status"
              value={formValues.status}
              options={delegateStatusOptionsList}
              onChange={handleFormChange}
            />
            <Form.Input
              label="Location"
              name="location"
              value={formValues.location || ''}
              onChange={handleFormChange}
            />
            <Form.Button onClick={() => setOpenModalType(null)}>Cancel</Form.Button>
            <Form.Button type="submit">Save</Form.Button>
          </Form>
        </Modal.Content>
      </Modal>
      {openModalType === 'editLocation' && (
        <LocationEditorModal
          onClose={() => setOpenModalType(null)}
          delegate={delegateToChange}
          onSubmit={editLocationAction}
        />
      )}
    </>
  );
}

function RegionalDelegate({ group, setOpenModalType }) {
  return group.parent_group_id && group.lead_user
    ? (
      <>
        <Icon
          name="edit"
          link
          onClick={() => {
            setOpenModalType('newLeadDelegate');
          }}
        />
        {group.lead_user.name}
      </>
    ) : (
      <Icon
        name="plus"
        link
        onClick={() => setOpenModalType('newLeadDelegate')}
      />
    );
}
