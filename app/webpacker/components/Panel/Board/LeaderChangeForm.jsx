import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import Loading from '../../Requests/Loading';
import { councilsStatus } from '../../../lib/wca-data.js.erb';
import { apiV0Urls } from '../../../lib/requests/routes.js.erb';
import WcaSearch from '../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../SearchWidget/SearchModel';

const OLD_LEADER_STATUS = {
  SENIOR_MEMBER: 'senior_member',
  MEMBER: 'member',
  RESIGN: 'resign',
};

const oldLeaderStatusOptions = [
  { name: 'Senior Member', value: OLD_LEADER_STATUS.SENIOR_MEMBER },
  { name: 'Member', value: OLD_LEADER_STATUS.MEMBER },
  { name: 'Resign', value: OLD_LEADER_STATUS.RESIGN },
];

export default function LeaderChangeForm({
  setEditLeader, syncData, group, oldLeader,
}) {
  const [formValues, setFormValues] = useState({
    newLeader: null,
    oldLeaderStatus: oldLeaderStatusOptions[0].value,
  });
  const { save } = useSaveAction();
  const [saving, setSaving] = useState(false);

  const handleFormChange = (_, { name, value }) => setFormValues({ ...formValues, [name]: value });

  const endLeaderChangeAction = () => {
    syncData();
    setEditLeader(null);
    setSaving(false);
  };

  const addBackOldLeaderIfNeeded = () => {
    if (formValues.oldLeaderStatus === OLD_LEADER_STATUS.RESIGN) {
      endLeaderChangeAction();
    } else {
      save(
        apiV0Urls.userRoles.create(),
        {
          userId: oldLeader.user.id,
          groupId: group.id,
          status: formValues.oldLeaderStatus,
        },
        endLeaderChangeAction,
        { method: 'POST' },
      );
    }
  };

  const leaderChangeAction = () => {
    setSaving(true);
    save(
      apiV0Urls.userRoles.create(),
      {
        userId: formValues.newLeader.id,
        groupId: group.id,
        status: councilsStatus.leader,
      },
      addBackOldLeaderIfNeeded,
      { method: 'POST' },
    );
  };

  if (saving) {
    return <Loading />;
  }

  return (
    <Form onSubmit={leaderChangeAction}>
      <Form.Field
        label="New Leader"
        control={WcaSearch}
        name="newLeader"
        value={formValues?.newLeader}
        onChange={handleFormChange}
        model={SEARCH_MODELS.user}
        multiple={false}
      />
      {oldLeader && (
        <Form.Field
          label="Old Leader Status"
          control={Form.Dropdown}
          name="oldLeaderStatus"
          value={formValues?.oldLeaderStatus}
          onChange={handleFormChange}
          options={oldLeaderStatusOptions.map((option) => ({
            key: option.value,
            text: option.name,
            value: option.value,
          }))}
        />
      )}
      <Form.Button onClick={() => setEditLeader(null)}>Cancel</Form.Button>
      <Form.Button type="submit">Save</Form.Button>
    </Form>
  );
}
