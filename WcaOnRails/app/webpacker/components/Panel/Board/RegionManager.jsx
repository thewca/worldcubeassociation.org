import React from 'react';
import {
  Button, ButtonGroup, Confirm, Form, Header, List, Modal,
} from 'semantic-ui-react';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import { fetchUserGroupsUrl, addUserGroupsUrl, userGroupsUpdateUrl } from '../../../lib/requests/routes.js.erb';
import Errored from '../../Requests/Errored';
import Loading from '../../Requests/Loading';
import useSaveAction from '../../../lib/hooks/useSaveAction';

const defaultRegion = {
  name: '',
  group_type: 'delegate_regions',
  parent_group_id: null,
  is_active: true,
  is_hidden: false,
};

function UserGroupVisibility({ userGroup, save, sync }) {
  const [open, setOpen] = React.useState(false);
  const iconName = userGroup.is_active ? 'eye' : 'eye slash';
  return (
    <>
      <List.Icon
        name={iconName}
        link
        onClick={() => setOpen(true)}
      />
      <Confirm
        open={open}
        content={`Are you sure you want to ${userGroup.is_active ? 'deactivate' : 'activate'} ${userGroup.name}?`}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          save(
            userGroupsUpdateUrl(userGroup.id),
            { is_active: !userGroup.is_active, is_hidden: userGroup.is_hidden },
            sync,
          );
        }}
      />
    </>
  );
}

export default function RegionManager() {
  const {
    data, loading, error, sync,
  } = useLoadedData(fetchUserGroupsUrl('delegate_regions'));
  const { save, saving } = useSaveAction();
  const [openModalType, setOpenModalType] = React.useState();
  const [newRegion, setNewRegion] = React.useState(defaultRegion);
  const [saveError, setSaveError] = React.useState();

  const closeModal = () => setOpenModalType(null);

  const regions = React.useMemo(() => data?.filter((group) => !group.parent_group_id).sort(
    (group1, group2) => group1.name.localeCompare(group2.name),
  ), [data]);

  const subRegions = React.useMemo(() => {
    const subRegionsList = data?.filter((group) => group.parent_group_id) || [];
    return Object.groupBy(subRegionsList, (group) => group.parent_group_id);
  }, [data]);

  if (loading || saving) return <Loading />;
  if (error || saveError) return <Errored />;

  return (
    <>
      <Header as="h2">Region Manager</Header>
      <List bulleted>
        {regions.map((region) => (
          <List.Item key={region.id}>
            <List.Content>
              <UserGroupVisibility userGroup={region} save={save} sync={sync} />
              {region.name}
              <List.List>
                {subRegions[region.id]?.map((subRegion) => (
                  <List.Item key={subRegion.id}>
                    <List.Content>
                      <UserGroupVisibility userGroup={subRegion} save={save} sync={sync} />
                      {subRegion.name}
                    </List.Content>
                  </List.Item>
                ))}
              </List.List>
            </List.Content>
          </List.Item>
        ))}
      </List>
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
    </>
  );
}
