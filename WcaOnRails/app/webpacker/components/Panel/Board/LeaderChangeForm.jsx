import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import WcaSearchFormControl from '../../SearchWidget/WcaSearchFormControl';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import Loading from '../../Requests/Loading';
import { COUNCILS_STATUS } from '../../../lib/helpers/groups-and-roles-constants';
import { apiV0Urls } from '../../../lib/requests/routes.js.erb';

const oldLeaderStatusOptions = ['senior_member', 'member', 'resign'];
const oldLeaderStatusOptionsMap = {
  senior_member: 'Senior Member',
  member: 'Member',
  resign: 'Resign',
};

export default function LeaderChangeForm({
  setEditLeader, syncData, group, oldLeader,
}) {
  const [formValues, setFormValues] = useState({
    newLeader: null,
    oldLeaderStatus: oldLeaderStatusOptions[0],
  });
  const { save } = useSaveAction();
  const [saving, setSaving] = useState(false);

  const handleFormChange = (_, { name, value }) => setFormValues({ ...formValues, [name]: value });

  const changeOldLeaderStatus = async () => new Promise((resolve) => {
    if (!oldLeader) { // No old leader
      resolve();
      return;
    }
    if (formValues.oldLeaderStatus === oldLeaderStatusOptions[2]) { // Resign
      save(
        apiV0Urls.userRoles.delete(oldLeader.id),
        {
          userId: oldLeader.user.id,
          groupId: oldLeader.group.id,
        },
        resolve,
        { method: 'DELETE' },
      );
    } else { // Change member status
      save(
        apiV0Urls.userRoles.update(oldLeader.id),
        {
          userId: oldLeader.user.id,
          groupId: oldLeader.group.id,
          status: formValues.oldLeaderStatus,
        },
        resolve,
        { method: 'PATCH' },
      );
    }
  });

  const changeNewLeader = async () => new Promise((resolve) => {
    save(
      apiV0Urls.userRoles.create(),
      {
        userId: formValues.newLeader.id,
        groupId: group.id,
        status: COUNCILS_STATUS.LEADER,
      },
      resolve,
      { method: 'POST' },
    );
  });

  const leaderChangeAction = async () => {
    setSaving(true);
    await changeOldLeaderStatus();
    await changeNewLeader();
    syncData();
    setEditLeader(null);
    setSaving(false);
  };

  if (saving) {
    return <Loading />;
  }

  return (
    <Form onSubmit={leaderChangeAction}>
      <Form.Field
        label="New Leader"
        control={WcaSearchFormControl}
        name="newLeader"
        value={formValues?.newLeader}
        onChange={handleFormChange}
        model="user"
        multiple={false}
      />
      <Form.Field
        label="Old Leader Status"
        control={Form.Dropdown}
        name="oldLeaderStatus"
        value={formValues?.oldLeaderStatus}
        onChange={handleFormChange}
        options={oldLeaderStatusOptions.map((option) => ({
          key: option,
          text: oldLeaderStatusOptionsMap[option],
          value: option,
        }))}
      />
      <Form.Button onClick={() => setEditLeader(null)}>Cancel</Form.Button>
      <Form.Button type="submit">Save</Form.Button>
    </Form>
  );
}
