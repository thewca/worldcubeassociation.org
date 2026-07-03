import React from 'react';
import {
  Button, ButtonGroup, Form, Header, Icon, List, Modal, Table,
} from 'semantic-ui-react';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import {
  fetchUserGroupsUrl, addUserGroupsUrl,
} from '../../../../lib/requests/routes.js.erb';
import { delegateRegionsStatus } from '../../../../lib/wca-data.js.erb';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import useSaveAction from '../../../../lib/hooks/useSaveAction';
import CreateModal from '../../views/UserRoles/CreateModal';
import UpdateModal from '../../views/UserGroups/UpdateModal';

const defaultRegion = {
  name: '',
  group_type: 'delegate_regions',
  parent_group_id: null,
  is_active: true,
  is_hidden: false,
  friendlyId: '',
};

export default function RegionManager() {
  const {
    data, loading, error, sync,
  } = useLoadedData(fetchUserGroupsUrl('delegate_regions'));
  const { save, saving } = useSaveAction();
  const [openModalType, setOpenModalType] = React.useState();
  const [newRegion, setNewRegion] = React.useState(defaultRegion);
  const [saveError, setSaveError] = React.useState();
  const [selectedGroup, setSelectedGroup] = React.useState();

  const selectedGroupAndShowModal = (group, modalType) => {
    setSelectedGroup(group);
    setOpenModalType(modalType);
  };

  const closeModal = () => setOpenModalType(null);

  const regions = React.useMemo(() => data?.filter((group) => !group.parent_group_id), [data]);

  const subRegions = React.useMemo(() => {
    const subRegionsList = data?.filter((group) => group.parent_group_id) || [];
    return Object.groupBy(subRegionsList, (group) => group.parent_group_id);
  }, [data]);

  if (loading || saving) return <Loading />;
  if (error || saveError) return <Errored error={error || saveError} />;

  return (
    <>
      <Header as="h2">Region Manager</Header>
      <p>
        Visibility: Whether the region is active & visible to the public or not.
      </p>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Region</Table.HeaderCell>
            <Table.HeaderCell>Senior Delegate</Table.HeaderCell>
            <Table.HeaderCell>Sub-Regions</Table.HeaderCell>
            <Table.HeaderCell>Regional Delegate</Table.HeaderCell>
            <Table.HeaderCell>Visibility</Table.HeaderCell>
            <Table.HeaderCell>Edit</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {regions.map((region) => (
            <>
              <Table.Row key={region.id}>
                <Table.Cell>
                  {region.name}
                </Table.Cell>
                <Table.Cell>
                  {region.lead_user
                    ? (
                      <>
                        <Icon
                          name="edit"
                          link
                          onClick={() => selectedGroupAndShowModal(region, 'newLeadDelegate')}
                        />
                        {region.lead_user.name}
                      </>
                    ) : (
                      <Icon
                        name="plus"
                        link
                        onClick={() => selectedGroupAndShowModal(region, 'newLeadDelegate')}
                      />
                    )}
                </Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell>
                  <List.Icon name={region.is_active ? 'eye' : 'eye slash'} />
                </Table.Cell>
                <Table.Cell>
                  <Button onClick={() => selectedGroupAndShowModal(region, 'edit')}>Edit</Button>
                </Table.Cell>
              </Table.Row>
              {subRegions[region.id]?.map((subRegion) => (
                <Table.Row key={subRegion.id}>
                  <Table.Cell />
                  <Table.Cell />
                  <Table.Cell>
                    {subRegion.name}
                  </Table.Cell>
                  <Table.Cell>
                    {subRegion.lead_user
                      ? (
                        <>
                          <Icon
                            name="edit"
                            link
                            onClick={() => selectedGroupAndShowModal(subRegion, 'newLeadDelegate')}
                          />
                          {subRegion.lead_user.name}
                        </>
                      ) : (
                        <Icon
                          name="plus"
                          link
                          onClick={() => selectedGroupAndShowModal(subRegion, 'newLeadDelegate')}
                        />
                      )}
                  </Table.Cell>
                  <Table.Cell>
                    <List.Icon name={subRegion.is_active ? 'eye' : 'eye slash'} />
                  </Table.Cell>
                  <Table.Cell>
                    <Button onClick={() => selectedGroupAndShowModal(subRegion, 'edit')}>Edit</Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </>
          ))}
        </Table.Body>
      </Table>
      <ButtonGroup>
        <Button
          onClick={() => setOpenModalType('newRegion')}
          disabled={saving}
        >
          Add new region
        </Button>
        <Button
          onClick={() => setOpenModalType('newSubregion')}
          disabled={saving}
        >
          Add new subregion
        </Button>
      </ButtonGroup>
      <Modal
        size="fullscreen"
        onClose={() => {
          closeModal();
          setNewRegion(defaultRegion);
        }}
        open={openModalType === 'newRegion' || openModalType === 'newSubregion'}
      >
        <Modal.Content>
          <Form>
            {openModalType === 'newSubregion' && (
              <Form.Dropdown
                label="Parent region"
                fluid
                selection
                value={newRegion.parent_group_id}
                onChange={(e, { value }) => setNewRegion({ ...newRegion, parent_group_id: value })}
                options={regions.map((region) => ({
                  key: region.id,
                  text: region.name,
                  value: region.id,
                }))}
              />
            )}
            <Form.Input
              label="Name"
              value={newRegion.name}
              onChange={(e, { value }) => setNewRegion({ ...newRegion, name: value })}
            />
            <Form.Input
              label="Friendly ID"
              value={newRegion.friendlyId}
              onChange={(e, { value }) => setNewRegion({ ...newRegion, friendlyId: value })}
            />
            <Form.Button
              onClick={() => {
                closeModal();
                setNewRegion(defaultRegion);
              }}
            >
              Cancel
            </Form.Button>
            <Form.Button
              disabled={
                newRegion.name.length === 0
                || (openModalType === 'newSubregion' && !newRegion.parent_group_id)
              }
              onClick={() => {
                closeModal();
                save(addUserGroupsUrl, newRegion, () => sync(), { method: 'POST' }, setSaveError);
                setNewRegion(defaultRegion);
              }}
            >
              Save
            </Form.Button>
          </Form>
        </Modal.Content>
      </Modal>
      <CreateModal
        open={openModalType === 'newLeadDelegate'}
        onClose={() => {
          closeModal();
          setSelectedGroup(null);
          sync();
        }}
        title="New Lead Delegate"
        groupId={selectedGroup?.id}
        status={(selectedGroup?.parent_group_id
          ? delegateRegionsStatus.regional_delegate
          : delegateRegionsStatus.senior_delegate)}
        location={selectedGroup?.name}
      />
      <UpdateModal
        open={openModalType === 'edit'}
        onClose={() => {
          closeModal();
          setSelectedGroup(null);
          sync();
        }}
        title="Edit Region"
        userGroupId={selectedGroup?.id}
      />
    </>
  );
}
