import React from 'react';
import {
  Icon, Message, Popup, Table,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import I18n from '../../lib/i18n';
import { competitionStatusText } from '../../lib/utils/competition-table';
import { competitionEditRegistrationsUrl, editCompetitionsUrl } from '../../lib/requests/routes.js.erb';
import {
  DateTableCell, LocationTableCell, NameTableCell, ReportTableCell,
} from './TableCells';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import { toRelativeOptions } from '../../lib/utils/dates';

const competingStatusIcon = (competingStatus) => {
  switch (competingStatus) {
    case 'pending': return <Icon name="hourglass" />;
    case 'waiting_list': return <Icon name="hourglass" />;
    case 'accepted': return <Icon name="check circle" />;
    case 'cancelled': return <Icon name="trash" />;
    case 'rejected': return <Icon name="trash" />;
    default: return null;
  }
};

const registrationStatusIconText = (competition) => {
  if (competition.registration_status === 'not_yet_opened') {
    return I18n.t(
      'competitions.index.tooltips.registration.opens_in',
      {
        relativeDate: DateTime.fromISO(competition.registration_open)
          .toRelative(toRelativeOptions.default),
      },
    );
  }
  if (competition.registration_status === 'past') {
    return I18n.t(
      'competitions.index.tooltips.registration.closed',
      {
        relativeDate: DateTime.fromISO(competition.start_date)
          .toRelative(toRelativeOptions.roundUpAndAtBestDayPrecision),
      },
    );
  }
  if (competition.registration_status === 'full') {
    return I18n.t('competitions.index.tooltips.registration.full');
  }
  return I18n.t('competitions.index.tooltips.registration.open');
};

const registrationStatusIcon = (competition) => {
  if (competition.registration_status === 'not_yet_opened') {
    return <Icon name="clock" color="blue" />;
  }
  if (competition.registration_status === 'past') {
    return <Icon name="user times" color="red" />;
  }
  if (competition.registration_status === 'full') {
    return <Icon className="user clock" color="orange" />;
  }
  return <Icon name="user plus" color="green" />;
};

export default function UpcomingCompetitionTable({
  competitions,
  permissions,
  registrationStatuses,
  shouldShowRegistrationStatus = true,
  fallbackMessage = null,
}) {
  const canViewDelegateReport = permissions.can_view_delegate_report.scope === '*'
    || competitions.some((c) => permissions.can_view_delegate_report.scope.includes(c.id));
  const canAdminAVisibleComp = permissions.can_administer_competitions.scope === '*'
    || competitions.some((c) => permissions.can_administer_competitions.scope.includes(c.id));

  if (competitions.length === 0 && fallbackMessage) {
    return (
      <Message info>
        <I18nHTMLTranslate i18nKey={fallbackMessage.key} options={fallbackMessage.options} />
      </Message>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table basic unstackable compact singleLine>
        <Table.Header>
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
            {canAdminAVisibleComp && (
              <>
                <Table.HeaderCell />
                <Table.HeaderCell />
              </>
            )}
            {canViewDelegateReport && <Table.HeaderCell />}

          </Table.Row>
        </Table.Header>

        <Table.Body>
          {competitions.map((competition) => {
            const canAdminThisComp = permissions.can_administer_competitions.scope === '*'
              || permissions.can_administer_competitions.scope.includes(competition.id);

            return (
              <Popup
                key={competition.id}
                position="top center"
                content={competitionStatusText(competition, registrationStatuses[competition.id])}
                trigger={(
                  <Table.Row
                    positive={competition['confirmed?'] && !competition['cancelled?']}
                    negative={!competition['visible?']}
                  >
                    {shouldShowRegistrationStatus && (
                      <Popup
                        position="top left"
                        content={registrationStatusIconText(competition)}
                        trigger={(
                          <Table.Cell collapsing>
                            {registrationStatusIcon(competition)}
                          </Table.Cell>
                        )}
                      />
                    )}
                    <NameTableCell competition={competition} />
                    <LocationTableCell competition={competition} />
                    <DateTableCell competition={competition} />
                    <Table.Cell>
                      {competingStatusIcon(registrationStatuses[competition.id])}
                    </Table.Cell>
                    {canAdminThisComp && (
                      <Table.Cell>
                        <a href={editCompetitionsUrl(competition.id)}>
                          {I18n.t('competitions.my_competitions_table.edit')}
                        </a>
                      </Table.Cell>
                    )}
                    {canAdminThisComp ? (
                      <Table.Cell>
                        <a href={competitionEditRegistrationsUrl(competition.id)}>
                          {I18n.t('competitions.my_competitions_table.registrations')}
                        </a>
                      </Table.Cell>
                    ) : (canAdminAVisibleComp && (
                      <>
                        <Table.Cell />
                        <Table.Cell />
                      </>
                    ))}
                    {canViewDelegateReport && (
                      <ReportTableCell
                        competitionId={competition.id}
                        permissions={permissions}
                      />
                    )}
                  </Table.Row>
                )}
              />
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}
