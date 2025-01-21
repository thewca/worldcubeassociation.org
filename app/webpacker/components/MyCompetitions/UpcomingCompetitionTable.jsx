import {
  Icon, Message, Popup, Table,
} from 'semantic-ui-react';
import React from 'react';
import { DateTime } from 'luxon';
import I18n from '../../lib/i18n';
import { competitionStatusText } from '../../lib/utils/competition-table';
import { competitionRegistrationsUrl, editCompetitionsUrl } from '../../lib/requests/routes.js.erb';
import {
  DateTableCell, LocationTableCell, NameTableCell, ReportTableCell,
} from './TableCells';
import I18nHTMLTranslate from '../I18nHTMLTranslate';

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
  const toRelativeOptions = {
    locale: window.I18n.locale,
    // don't be more precise than "days" (i.e. no hours/minutes/seconds)
    unit: ["years", "months", "weeks", "days"],
    // round up, e.g. in 8 hours -> pads to 1 day 8 hours -> rounds to "in 1 day"
    padding: 24 * 60 * 60 * 1000,
  };

  if (competition.registration_status === 'not_yet_opened') {
    return I18n.t('competitions.index.tooltips.registration.opens_in', { duration: DateTime.fromISO(competition.registration_open).toRelative({ locale: window.I18n.locale }) });
  }
  if (competition.registration_status === 'past') {
    return I18n.t('competitions.index.tooltips.registration.closed', { days: DateTime.fromISO(competition.start_date).toRelative(toRelativeOptions) });
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
    return <Icon name="user clock" color="orange" />;
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
  const canViewDelegateReport = permissions.can_view_delegate_report.scope === '*' || competitions.some((c) => permissions.can_view_delegate_report.scope.includes(c.id));

  if (competitions.length === 0 && fallbackMessage) {
    return (
      <Message info>
        <I18nHTMLTranslate i18nKey={fallbackMessage.key} options={fallbackMessage.options} />
      </Message>
    );
  }

  return (
    <div style={{ overflowX: 'scroll' }}>
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
            {canViewDelegateReport && (
              <>
                <Table.HeaderCell />
                <Table.HeaderCell />
                <Table.HeaderCell />
              </>
            )}

          </Table.Row>
        </Table.Header>

        <Table.Body>
          {competitions.map((competition) => (
            <Popup
              key={competition.id}
              position="top center"
              content={competitionStatusText(competition, registrationStatuses[competition.id])}
              trigger={(
                <Table.Row positive={competition['confirmed?'] && !competition['cancelled?']} negative={!competition['visible?']}>
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
                  {(permissions.can_organize_competitions.scope === '*' || permissions.can_organize_competitions.scope.includes(competition.id)) && (
                    <Table.Cell>
                      <a href={editCompetitionsUrl(competition.id)}>
                        {I18n.t('competitions.my_competitions_table.edit')}
                      </a>
                    </Table.Cell>
                  )}
                  {(permissions.can_organize_competitions.scope === '*' || permissions.can_organize_competitions.scope.includes(competition.id)) && (
                    <Table.Cell>
                      <a href={competitionRegistrationsUrl(competition.id)}>
                        {I18n.t('competitions.my_competitions_table.registrations')}
                      </a>
                    </Table.Cell>
                  )}
                  <ReportTableCell
                    competitionId={competition.id}
                    permissions={permissions}
                    canViewDelegateReport={canViewDelegateReport}
                  />
                </Table.Row>
              )}
            />
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
