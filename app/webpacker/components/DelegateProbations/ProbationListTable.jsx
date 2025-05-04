import React from 'react';
import { Table, Confirm } from 'semantic-ui-react';
import UserBadge from '../UserBadge';
import UtcDatePicker from '../wca/UtcDatePicker';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';

export default function ProbationListTable({
  roleList, isActive, save, sync,
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [endProbationParams, setEndProbationParams] = React.useState();

  const endProbation = () => {
    save(apiV0Urls.userRoles.update(endProbationParams.probationRoleId), {
      endDate: endProbationParams.endDate,
    }, sync, { method: 'PATCH' });

    setConfirmOpen(false);
    setEndProbationParams(null);
  };

  return (
    <>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width={5}>User</Table.HeaderCell>
            <Table.HeaderCell width={2}>Start date</Table.HeaderCell>
            <Table.HeaderCell width={2}>End date</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {roleList.map((probationRole) => (
            <Table.Row key={probationRole.id}>
              <Table.Cell>
                <UserBadge user={probationRole.user} hideBorder leftAlign />
              </Table.Cell>
              <Table.Cell>{probationRole.start_date}</Table.Cell>
              <Table.Cell>
                {isActive ? (
                  <UtcDatePicker
                    isoDate={probationRole.end_date}
                    onChange={(isoDate) => {
                      setEndProbationParams({
                        probationRoleId: probationRole.id,
                        endDate: isoDate,
                      });
                      setConfirmOpen(true);
                    }}
                  />
                ) : (
                  probationRole.end_date
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <Confirm
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={endProbation}
        content="Are you sure you want to change end date of this probation?"
      />
    </>
  );
}
