import {
  Icon,
  Popup, Table, TableBody, TableHeader,
} from 'semantic-ui-react';
import React from 'react';
import I18n from '../../lib/i18n';
import { cityAndCountry, competitionStatusText } from '../../lib/utils/competition-table';
import { dateRange } from '../../lib/utils/dates';
import { competitionRegistrationsUrl, editCompetitionsUrl } from '../../lib/requests/routes.js.erb';
import ReportTableCell from './ReportTableCell';

const registrationStatusIcon = (registrationStatus) => {
  switch (registrationStatus?.wcif_status) {
    case 'pending': return <Icon name="hourglass" />;
    case 'accepted': return <Icon name="check circle" />;
    case 'deleted': return <Icon name="trash" />;
    default: return <Icon />;
  }
};

const competitionStatusIcon = (competition) => {
  if (competition['registration_not_yet_opened?']) {
    return <Icon name="clock" color="blue" />;
  }
  if (competition['registration_past?']) {
    return <Icon name="user times" color="red" />;
  }
  if (competition['registration_full?']) {
    return <Icon name="user clock" color="orange" />;
  }
  return <Icon name="user plus" color="green" />;
};

export default function UpcomingCompetitionTable({
  competitions, permissions, registrationStatuses, shouldShowRegistrationStatus = false,
}) {
  return (
    <Table>
      <TableHeader>
        <Table.Row>
          { shouldShowRegistrationStatus && <Table.HeaderCell /> }
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.name')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.location')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.adjacent_competitions.date')}
          </Table.HeaderCell>
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
        </Table.Row>
      </TableHeader>

      <TableBody>
        {competitions.map((competition) => (
          <Popup
            position="top center"
            content={competitionStatusText(competition, registrationStatuses[competition.id])}
            trigger={(
              <Table.Row key={competition.id} positive={competition['confirmed?'] && !competition['cancelled?']}>
                { shouldShowRegistrationStatus && (
                  <Table.Cell>
                    {competitionStatusIcon(competition)}
                  </Table.Cell>
                )}
                <Table.Cell>
                  <a href={competition.url}>{competition.name}</a>
                </Table.Cell>
                <Table.Cell>
                  {cityAndCountry(competition)}
                </Table.Cell>
                <Table.Cell>
                  {dateRange(competition.start_date, competition.end_date)}
                </Table.Cell>
                <Table.Cell>
                  {registrationStatusIcon(registrationStatuses[competition.id])}
                </Table.Cell>
                <Table.Cell>
                  { (permissions.can_organize_competitions.scope === '*' || permissions.can_organize_competitions.scope.includes(competition.id)) && (
                    <a href={editCompetitionsUrl(competition.id)}>
                      { I18n.t('competitions.my_competitions_table.edit') }
                    </a>
                  )}
                </Table.Cell>
                <Table.Cell>
                  { (permissions.can_organize_competitions.scope === '*' || permissions.can_organize_competitions.scope.includes(competition.id)) && (
                    <a href={competitionRegistrationsUrl(competition.id)}>
                      { I18n.t('competitions.my_competitions_table.registrations') }
                    </a>
                  )}
                </Table.Cell>
                <ReportTableCell competitionId={competition.id} permissions={permissions} />
              </Table.Row>
            )}
          />
        ))}
      </TableBody>
    </Table>
  );
}
