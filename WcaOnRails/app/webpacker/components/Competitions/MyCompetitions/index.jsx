import React, {useState} from 'react';
import {
  Accordion,
  Header,
  Icon,
  Table,
  TableBody,
  TableHeader,
  Popup,
  Checkbox,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import {
  competitionReportEditUrl,
  competitionReportUrl,
  myCompetitionsAPIUrl,
  personUrl,
  meAPIUrl,
  permissionsAPIUrl,
  editCompetitionsUrl,
  competitionRegistrationsUrl,
} from '../../../lib/requests/routes.js.erb';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import Loading from '../../Requests/Loading';
import { countries } from '../../../lib/wca-data.js.erb';

const defaultPermissions = {
  can_attend_competitions: { scope: [] },
  can_organize_competitions: { scope: [] },
  can_administer_competitions: { scope: [] },
};

const dateRange = (startDate, endDate) => {
  const momentStart = moment(startDate);
  const momentEnd = moment(endDate);
  // One Day competition
  if (momentStart.isSame(momentEnd)) {
    return `${momentStart.format('ll')}`;
  }
  // Same month
  if (momentStart.isSame(momentEnd, 'month')) {
    return `${momentStart.format('MMM DD')} - ${momentEnd.format('DD, YYYY')}`;
  }
  return `${momentStart.format('ll')} - ${momentEnd.format('ll')}`;
};

const cityAndCountry = (competition) => [competition.city, countries.byIso2[competition.country_iso2].name].join(', ');

const registrationStatusIcon = (registrationStatus) => {
  switch (registrationStatus?.wcif_status) {
    case 'pending': return <Icon name="hourglass" />;
    case 'accepted': return <Icon name="check circle" />;
    case 'deleted': return <Icon name="trash" />;
    default: return <Icon />;
  }
};

const competitionStatusText = (competition, registrationStatus) => {
  let statusText = '';
  if (registrationStatus?.wcif_status === 'pending') {
    statusText += I18n.t('competitions.messages.tooltip_waiting_list');
  } else if (registrationStatus?.wcif_status === 'accepted') {
    statusText += I18n.t('competitions.messages.tooltip_registered');
  } else if (registrationStatus?.wcif_status === 'deleted') {
    statusText += I18n.t('competitions.messages.tooltip_deleted');
  }
  if (competition['confirmed?']) {
    statusText += I18n.t('competitions.messages.confirmed_visible');
  } else if (competition['visible?']) {
    statusText += I18n.t('competitions.messages.confirmed_not_visible');
  } else {
    statusText += I18n.t('competitions.messages.not_confirmed_not_visible');
  }
  return statusText;
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

function ReportTableCell({ permissions, competitionId, isReportPosted }) {
  return (
    <Table.Cell>
      {(permissions.can_administer_competitions.scope === '*' || permissions.can_administer_competitions.scope.includes(competitionId)) && (
      <>
        <Popup
          content={I18n.t('competitions.my_competitions_table.report')}
          trigger={(
            <a href={competitionReportUrl(competitionId)}>
              <Icon name="file alternate" />
            </a>
          )}
        />
        <Popup
          content={I18n.t('competitions.my_competitions_table.edit_report')}
          trigger={(
            <a href={competitionReportEditUrl(competitionId)}>
              <Icon name="edit" />
            </a>
          )}
        />
        { !isReportPosted
          && permissions.can_administer_competitions.scope.includes(competitionId) && (
          <Popup
            content={I18n.t('competitions.my_competitions_table.missing_report')}
            trigger={(
              <Icon name="warning" />
            )}
          />
        )}
      </>
      )}
    </Table.Cell>
  );
}

function UpcomingCompetitionTable({
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

function PastCompetitionsTable({ competitions, permissions }) {
  return (
    <Table striped>
      <TableHeader>
        <Table.Row>
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
        </Table.Row>
      </TableHeader>

      <TableBody>
        {competitions.map((competition) => (
          <Table.Row key={competition.id}>
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
              {!competition['results_posted?'] && (
                <Icon name="calendar check" />
              )}
            </Table.Cell>
            <Table.Cell>
              {competition['results_posted?'] && (
              <Popup
                content={I18n.t('competitions.my_competitions_table.results_up')}
                trigger={(
                  <Icon name="check circle" />
                )}
              />
              )}
            </Table.Cell>
            <ReportTableCell competitionId={competition.id} permissions={permissions} />
          </Table.Row>
        ))}
      </TableBody>
    </Table>
  );
}

export default function MyCompetitions() {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [shouldShowRegistrationStatus, setShouldShowRegistrationStatus] = useState(false);

  const { data: competitions, loading: competitionsLoading } = useLoadedData(myCompetitionsAPIUrl);
  const { data: me, loading: meLoading } = useLoadedData(meAPIUrl);
  const { data: permissions, loading: permissionsLoading } = useLoadedData(permissionsAPIUrl);

  return (
    (meLoading || competitionsLoading || permissionsLoading) ? <Loading /> : (
      <>
        <Header>
          {I18n.t('competitions.my_competitions.title')}
        </Header>
        <p>
          {I18n.t('competitions.my_competitions.disclaimer')}
        </p>
        <UpcomingCompetitionTable
          competitions={competitions?.future_competitions ?? []}
          permissions={permissions ?? defaultPermissions}
          registrationStatuses={competitions?.registered_for_by_competition_id ?? {}}
        />
        <Accordion fluid styled>
          <Accordion.Title
            active={isAccordionOpen}
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          >
            {`${I18n.t('competitions.my_competitions.past_competitions')} (${competitions?.past_competitions?.length ?? 0})`}
          </Accordion.Title>
          <Accordion.Content active={isAccordionOpen}>
            <PastCompetitionsTable
              competitions={competitions?.past_competitions ?? []}
              permissions={permissions ?? defaultPermissions}
            />
          </Accordion.Content>
        </Accordion>
        <a href={personUrl(me.user.wca_id)}>{I18n.t('layouts.navigation.my_results')}</a>
        <Header>
          <Icon name="bookmark" />
          {I18n.t('competitions.my_competitions.bookmarked_title')}
        </Header>
        <p>{I18n.t('competitions.my_competitions.bookmarked_explanation')}</p>
        <Checkbox
          checked={shouldShowRegistrationStatus}
          label={I18n.t('competitions.index.show_registration_status')}
          onChange={() => setShouldShowRegistrationStatus(!shouldShowRegistrationStatus)}
        />
        <UpcomingCompetitionTable
          competitions={competitions?.bookmarked_competitions ?? []}
          permissions={permissions ?? defaultPermissions}
          registrationStatuses={competitions?.registered_for_by_competition_id ?? {}}
          shouldShowRegistrationStatus={shouldShowRegistrationStatus}
        />
      </>
    )
  );
}
