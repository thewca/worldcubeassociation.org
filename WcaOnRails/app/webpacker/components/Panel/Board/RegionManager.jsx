import React from 'react';
import {
  Button, ButtonGroup, Confirm, Form, Header, List, Modal,
} from 'semantic-ui-react';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import { userGroupsUrl, userGroupsUpdateUrl } from '../../../lib/requests/routes.js.erb';
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
  return (
    <>
      {!userGroup.is_hidden && (
      <List.Icon
        name="eye"
        link
        onClick={() => setOpen(true)}
      />
      )}
      {userGroup.is_hidden && (
      <List.Icon
        name="eye slash"
        link
        onClick={() => setOpen(true)}
      />
      )}
      <Confirm
        open={open}
        content={`Are you sure you want to ${userGroup.is_hidden ? 'unhide' : 'hide'} ${userGroup.name}?`}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          save(
            userGroupsUpdateUrl(userGroup.id),
            { is_hidden: !userGroup.is_hidden },
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
  } = useLoadedData(userGroupsUrl({
    groupType: 'delegate_regions',
  }));
  const { save, saving } = useSaveAction();
  const [openNewRegionModal, setOpenNewRegionModal] = React.useState(false);
  const [openNewSubregionModal, setOpenNewSubregionModal] = React.useState(false);
  const [newRegion, setNewRegion] = React.useState(defaultRegion);

  const closeModal = () => {
    if (openNewRegionModal) {
      setOpenNewRegionModal(false);
    } else {
      setOpenNewSubregionModal(false);
    }
  };

  const regions = React.useMemo(() => data?.filter((group) => !group.parent_group_id).sort(
    (group1, group2) => group1.name.localeCompare(group2.name),
  ), [data]);

  const subRegions = React.useMemo(() => {
    const subRegionsMap = {};
    data?.forEach((group) => {
      if (group.parent_group_id) {
        if (!subRegionsMap[group.parent_group_id]) {
          subRegionsMap[group.parent_group_id] = [];
        }
        subRegionsMap[group.parent_group_id].push(group);
      }
    });
    return subRegionsMap;
  }, [data]);

  if (loading || saving) return <Loading />;
  if (error) return <Errored />;

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
        <Button onClick={() => setOpenNewRegionModal(true)}>Add new region</Button>
        <Button onClick={() => setOpenNewSubregionModal(true)}>Add new subregion</Button>
      </ButtonGroup>
      <Modal
        size="fullscreen"
        onClose={() => {
          closeModal();
          setNewRegion(defaultRegion);
        }}
        open={openNewRegionModal || openNewSubregionModal}
      >
        <Modal.Content>
          <Form>
            {openNewSubregionModal && (
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
              onClick={() => {
                closeModal();
                save(userGroupsUrl(), newRegion, () => sync(), { method: 'POST' });
                sync();
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
