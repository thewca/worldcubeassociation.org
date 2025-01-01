import {
  Icon,
  Popup, Table, TableBody, TableHeader,
} from 'semantic-ui-react';
import React from 'react';
import { DateTime } from 'luxon';
import I18n from '../../lib/i18n';
import { competitionStatusText } from '../../lib/utils/competition-table';
import { competitionRegistrationsUrl, editCompetitionsUrl } from '../../lib/requests/routes.js.erb';
import {
  DateTableCell, LocationTableCell, NameTableCell, ReportTableCell,
} from './TableCells';

const registrationStatusIcon = (registrationStatus) => {
  switch (registrationStatus) {
    case 'pending': return <Icon name="hourglass" />;
    case 'waiting_list': return <Icon name="hourglass" />;
    case 'accepted': return <Icon name="check circle" />;
    case 'cancelled': return <Icon name="trash" />;
    case 'rejected': return <Icon name="trash" />;
    default: return null;
  }
};

const competitionStatusIconText = (competition) => {
  if (competition.registration_status === 'not_yet_opened') {
    return I18n.t('competitions.index.tooltips.registration.opens_in', { duration: DateTime.fromISO(competition.registration_open).toRelative() });
  }
  if (competition.registration_status === 'past') {
    return I18n.t('competitions.index.tooltips.registration.closed', { days: DateTime.fromISO(competition.start_date).toRelative() });
  }
  if (competition.registration_status === 'full') {
    return I18n.t('competitions.index.tooltips.registration.full');
  }
  return I18n.t('competitions.index.tooltips.registration.open');
};

const competitionStatusIcon = (competition) => {
  if (competition.registration_status === 'not_yet_opened') {
    return <Icon name="clock" color="blue" />;
  }
  if (competition.registration_status === 'past') {
    return <Icon name="user times" color="red" />;
  }
  if (competition.registration_status === 'full') {
    return <Icon name="user clock" color="orange" />;
  }
  return <Icon name="user plus" color="green" />;
};

export default function UpcomingCompetitionTable({
  competitions, permissions, registrationStatuses, shouldShowRegistrationStatus = true,
}) {
  const canAdminCompetitions = permissions.can_administer_competitions.scope === '*' || competitions.some((c) => permissions.can_administer_competitions.scope.includes(c.id));

  return (
    <Table>
      <TableHeader>
        <Table.Row>
          { shouldShowRegistrationStatus && <Table.HeaderCell collapsing /> }
          <Table.HeaderCell>
            {I18n.t('competitions.competition_info.name')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.competition_info.location')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {I18n.t('competitions.competition_info.date')}
          </Table.HeaderCell>
          <Table.HeaderCell />
          {canAdminCompetitions
            && (
            <>
              <Table.HeaderCell />
              <Table.HeaderCell />
              <Table.HeaderCell />
            </>
            )}

        </Table.Row>
      </TableHeader>

      <TableBody>
        {competitions.map((competition) => (
          <Popup
            key={competition.id}
            position="top center"
            content={competitionStatusText(competition, registrationStatuses[competition.id])}
            trigger={(
              <Table.Row positive={competition['confirmed?'] && !competition['cancelled?']} negative={!competition['visible?']}>
                { shouldShowRegistrationStatus && (
                  <Popup
                    position="top left"
                    content={competitionStatusIconText(competition)}
                    trigger={(
                      <Table.Cell collapsing>
                        {competitionStatusIcon(competition)}
                      </Table.Cell>
                  )}
                  />
                )}
                <NameTableCell competition={competition} />
                <LocationTableCell competition={competition} />
                <DateTableCell competition={competition} />
                <Table.Cell>
                  {registrationStatusIcon(registrationStatuses[competition.id])}
                </Table.Cell>
                { (permissions.can_organize_competitions.scope === '*' || permissions.can_organize_competitions.scope.includes(competition.id)) && (
                <Table.Cell>
                  <a href={editCompetitionsUrl(competition.id)}>
                    { I18n.t('competitions.my_competitions_table.edit') }
                  </a>
                </Table.Cell>
                )}
                { (permissions.can_organize_competitions.scope === '*' || permissions.can_organize_competitions.scope.includes(competition.id)) && (
                <Table.Cell>
                  <a href={competitionRegistrationsUrl(competition.id)}>
                    { I18n.t('competitions.my_competitions_table.registrations') }
                  </a>
                </Table.Cell>
                )}
                <ReportTableCell competitionId={competition.id} permissions={permissions} canAdminCompetitions={canAdminCompetitions} />
              </Table.Row>
            )}
          />
        ))}
      </TableBody>
    </Table>
  );
}
