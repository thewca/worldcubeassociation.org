import React, { useMemo, useState } from 'react';
import { Icon, Modal, Table } from 'semantic-ui-react';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import { rolesOfGroupType, fetchUserGroupsUrl } from '../../../lib/requests/routes.js.erb';
import { COUNCILS_STATUS, GROUP_TYPE } from '../../../lib/helpers/groups-and-roles-constants';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';
import LeaderChangeForm from './LeaderChangeForm';

export default function CouncilLeaders() {
  const [editCouncil, setEditCouncil] = useState();
  const councilsFetch = useLoadedData(fetchUserGroupsUrl(GROUP_TYPE.COUNCILS));
  const councilLeadersFetch = useLoadedData(
    rolesOfGroupType(GROUP_TYPE.COUNCILS, COUNCILS_STATUS.LEADER),
  );

  const leaders = useMemo(() => {
    const leaderMap = {};
    councilLeadersFetch?.data?.forEach((leader) => {
      leaderMap[leader.group.id] = leader;
    });
    return leaderMap;
  }, [councilLeadersFetch.data]);

  if (councilLeadersFetch.loading || councilsFetch.loading) {
    return <Loading />;
  }
  if (councilLeadersFetch.error || councilsFetch.error) {
    return <Errored />;
  }

  return (
    <>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell />
            <Table.HeaderCell>Group</Table.HeaderCell>
            <Table.HeaderCell>Leader</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {councilsFetch.data.map((council) => (
            <Table.Row key={council.id}>
              <Table.Cell>
                <Icon
                  link
                  name="edit"
                  onClick={() => setEditCouncil(council)}
                />
              </Table.Cell>
              <Table.Cell>{council.name}</Table.Cell>
              <Table.Cell>{leaders[council.id]?.user?.name}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Modal
        open={!!editCouncil}
        onClose={() => setEditCouncil(null)}
      >
        <Modal.Header>{`Edit ${editCouncil?.name} Leader`}</Modal.Header>
        <Modal.Content>
          <LeaderChangeForm
            setEditLeader={setEditCouncil}
            syncData={councilLeadersFetch.sync}
            group={editCouncil}
            oldLeader={leaders[editCouncil?.id]}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
