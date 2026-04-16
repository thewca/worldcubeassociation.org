import React from 'react';
import {
  Icon, Popup, Loader, Table, Label, Header, Container, Grid, List, Image, Button,
} from 'semantic-ui-react';

import { BarLoader } from 'react-spinners';
import { DateTime } from 'luxon';
import I18n from '../../lib/i18n';
import {
  computeAnnouncementStatus,
  computeReportsAndResultsStatus,
  dayDifferenceFromToday,
  hasResultsPosted,
  isCancelled,
  isInProgress,
  isProbablyOver,
  PseudoLinkMarkdown,
  reportAdminCellContent,
  resultsSubmittedAtAdminCellContent,
  startYear,
  timeDifferenceBefore,
} from '../../lib/utils/competition-table';
import { countries, events } from '../../lib/wca-data.js.erb';
import { adminCompetitionUrl, competitionUrl } from '../../lib/requests/routes.js.erb';
import { dateRange, toRelativeOptions } from '../../lib/utils/dates';
import RegionFlag from '../wca/RegionFlag';

function ListViewSection({
  competitions,
  title,
  shouldShowRegStatus,
  shouldShowAdminDetails,
  selectedDelegate,
  isLoading,
  regStatusLoading,
  hasMoreCompsToLoad,
  isSortedByAnnouncement = false,
}) {
  return (
    <>
      <Header>
        {title}
        {competitions && competitions.length > 0 && (
          <Label horizontal size="large">
            {competitions.length}
            {hasMoreCompsToLoad && '+'}
          </Label>
        )}
      </Header>
      {shouldShowAdminDetails ? (
        <AdminCompetitionsTable
          competitions={competitions}
          isLoading={isLoading}
          hasMoreCompsToLoad={hasMoreCompsToLoad}
          shouldShowRegStatus={shouldShowRegStatus}
          selectedDelegate={selectedDelegate}
          regStatusLoading={regStatusLoading}
          isSortedByAnnouncement={isSortedByAnnouncement}
        />
      ) : (
        <ResponsiveCompetitionsTables
          competitions={competitions}
          isLoading={isLoading}
          hasMoreCompsToLoad={hasMoreCompsToLoad}
          shouldShowRegStatus={shouldShowRegStatus}
          regStatusLoading={regStatusLoading}
          isSortedByAnnouncement={isSortedByAnnouncement}
        />
      )}
      <BarLoader loading={isLoading} cssOverride={{ width: '100%' }} />
    </>
  );
}

function ResponsiveCompetitionsTables({
  competitions,
  isLoading,
  hasMoreCompsToLoad,
  shouldShowRegStatus,
  regStatusLoading,
  isSortedByAnnouncement,
}) {
  const noCompetitions = !competitions || competitions.length === 0;

  if (noCompetitions && !isLoading && !hasMoreCompsToLoad) {
    return (
      <Container text textAlign="center">{I18n.t('competitions.index.no_comp_found')}</Container>
    );
  }

  return (
    <Grid centered id="competitions-list">
      <Grid.Row only="computer">
        <CompetitionsTable
          competitions={competitions}
          isLoading={isLoading}
          shouldShowRegStatus={shouldShowRegStatus}
          regStatusLoading={regStatusLoading}
          isSortedByAnnouncement={isSortedByAnnouncement}
        />
      </Grid.Row>
      <Grid.Row only="tablet">
        <CompetitionsTabletTable
          competitions={competitions}
          isLoading={isLoading}
          shouldShowRegStatus={shouldShowRegStatus}
          regStatusLoading={regStatusLoading}
          isSortedByAnnouncement={isSortedByAnnouncement}
        />
      </Grid.Row>
      <Grid.Row only="mobile">
        <CompetitionsMobileTable
          competitions={competitions}
          isLoading={isLoading}
          shouldShowRegStatus={shouldShowRegStatus}
          regStatusLoading={regStatusLoading}
          isSortedByAnnouncement={isSortedByAnnouncement}
        />
      </Grid.Row>
    </Grid>
  );
}

export function CompetitionsTable({
  competitions,
  shouldShowRegStatus,
  regStatusLoading,
  isSortedByAnnouncement = false,
}) {
  return (
    <Table striped compact basic="very">
      <Table.Header fullWidth>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell textAlign="right">{I18n.t('competitions.competition_info.date')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('competitions.competition_info.name')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('competitions.competition_info.location')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('competitions.competition_info.events')}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {competitions?.map((comp, index) => (
          <React.Fragment key={comp.id}>
            <ConditionalYearHeader
              competitions={competitions}
              index={index}
              isSortedByAnnouncement={isSortedByAnnouncement}
              colSpan={5}
            />
            <Table.Row error={isCancelled(comp)} className="competition-info">
              <Table.Cell collapsing>
                <StatusIcon
                  comp={comp}
                  shouldShowRegStatus={shouldShowRegStatus}
                  isSortedByAnnouncement={isSortedByAnnouncement}
                  regStatusLoading={regStatusLoading}
                />
              </Table.Cell>
              <Table.Cell textAlign="right" width={2}>
                {dateRange(comp.start_date, comp.end_date)}
              </Table.Cell>
              <Table.Cell width={5}>
                {comp.country_iso2 && <RegionFlag iso2={comp.country_iso2} />}
                {' '}
                <a href={competitionUrl(comp.id)}>{comp.short_display_name}</a>
              </Table.Cell>
              <Table.Cell width={4}>
                <strong>{countries.byIso2[comp.country_iso2].name}</strong>
                {`, ${comp.city}`}
              </Table.Cell>
              <Table.Cell width={5}>
                {comp.event_ids?.map((eventId) => (
                  <Popup
                    key={eventId}
                    position="bottom center"
                    size="tiny"
                    content={events.byId[eventId].name}
                    trigger={(
                      <i
                        className={`cubing-icon icon event-${eventId}`}
                      />
                    )}
                  />
                ))}
              </Table.Cell>
            </Table.Row>
          </React.Fragment>
        ))}
      </Table.Body>
    </Table>
  );
}

export function CompetitionsTabletTable({
  competitions,
  shouldShowRegStatus,
  regStatusLoading,
  isSortedByAnnouncement = false,
}) {
  return (
    <Table striped compact="very" basic size="small">
      <Table.Header fullWidth>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell textAlign="right">{I18n.t('competitions.competition_info.date')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('competitions.competition_info.name')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('competitions.competition_info.location_and_venue')}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {competitions?.map((comp, index) => (
          <React.Fragment key={comp.id}>
            <ConditionalYearHeader
              competitions={competitions}
              index={index}
              isSortedByAnnouncement={isSortedByAnnouncement}
              colSpan={4}
            />
            <Table.Row error={isCancelled(comp)} className="competition-info">
              <Table.Cell collapsing>
                <StatusIcon
                  comp={comp}
                  shouldShowRegStatus={shouldShowRegStatus}
                  isSortedByAnnouncement={isSortedByAnnouncement}
                  regStatusLoading={regStatusLoading}
                />
              </Table.Cell>
              <Table.Cell textAlign="right" width={3}>
                {dateRange(comp.start_date, comp.end_date)}
              </Table.Cell>
              <Table.Cell width={6}>
                {comp.country_iso2 && <RegionFlag iso2={comp.country_iso2} />}
                {' '}
                <a href={competitionUrl(comp.id)}>{comp.short_display_name}</a>
              </Table.Cell>
              <Table.Cell width={7}>
                <span>
                  <strong>{countries.byIso2[comp.country_iso2].name}</strong>
                  {`, ${comp.city}`}
                </span>
                <PseudoLinkMarkdown text={comp.venue} />
              </Table.Cell>
            </Table.Row>
          </React.Fragment>
        ))}
      </Table.Body>
    </Table>
  );
}

export function CompetitionsMobileTable({
  competitions,
  shouldShowRegStatus,
  regStatusLoading,
  isSortedByAnnouncement = false,
}) {
  return (
    <Table striped compact="very" basic size="small">
      <Table.Body>
        {competitions?.map((comp, index) => (
          <React.Fragment key={comp.id}>
            <ConditionalYearHeader
              competitions={competitions}
              index={index}
              isSortedByAnnouncement={isSortedByAnnouncement}
              colSpan={3}
            />
            <Table.Row error={isCancelled(comp)} className="competition-info mobile-compact">
              <Table.Cell>
                <Label ribbon="right" size="small">
                  <StatusIcon
                    comp={comp}
                    shouldShowRegStatus={shouldShowRegStatus}
                    isSortedByAnnouncement={isSortedByAnnouncement}
                    regStatusLoading={regStatusLoading}
                  />
                  {dateRange(comp.start_date, comp.end_date)}
                </Label>
                {comp.country_iso2 && <RegionFlag iso2={comp.country_iso2} />}
                {' '}
                <a href={competitionUrl(comp.id)}>{comp.short_display_name}</a>
              </Table.Cell>
              {
                /* This "magical" 1px is necessary so that the long text from the venue
                *   "clears" the floating date indicator from above. Otherwise, the text
                *   would break too early. SemUI doesn't support "nicely" padding cells,
                *   if anyone has a better idea then please shout. */
              }
              <Table.Cell style={{ marginTop: '1px' }}>
                <span>
                  <strong>{countries.byIso2[comp.country_iso2].name}</strong>
                  {`, ${comp.city}`}
                </span>
                {' '}
                <PseudoLinkMarkdown text={comp.venue} RenderAs="span" />
              </Table.Cell>
            </Table.Row>
          </React.Fragment>
        ))}
      </Table.Body>
    </Table>
  );
}

function AdminCompetitionsTable({
  competitions,
  isLoading,
  hasMoreCompsToLoad,
  shouldShowRegStatus,
  selectedDelegate,
  regStatusLoading,
  isSortedByAnnouncement,
}) {
  const noCompetitions = !competitions || competitions.length === 0;

  if (noCompetitions && !isLoading && !hasMoreCompsToLoad) {
    return (
      <Container text textAlign="center">{I18n.t('competitions.index.no_comp_found')}</Container>
    );
  }

  return (
    <Table striped compact basic="very" size="small" unstackable>
      <Table.Header fullWidth>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell>{I18n.t('competitions.competition_info.name_and_location')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('competitions.competition_info.delegates')}</Table.HeaderCell>
          <Table.HeaderCell textAlign="center">{I18n.t('competitions.competition_info.date')}</Table.HeaderCell>
          <Table.HeaderCell textAlign="center">{I18n.t('competitions.competition_info.announced')}</Table.HeaderCell>
          <Table.HeaderCell textAlign="center">{I18n.t('competitions.competition_info.report_posted')}</Table.HeaderCell>
          <Table.HeaderCell textAlign="center">{I18n.t('competitions.competition_info.results_submitted')}</Table.HeaderCell>
          <Table.HeaderCell />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {competitions?.map((comp, index) => {
          const announcementStatus = computeAnnouncementStatus(comp);
          const reportPostedStatus = computeReportsAndResultsStatus(comp, comp.report_posted_at);
          const resultsPostedStatus = computeReportsAndResultsStatus(comp, comp.results_posted_at);

          return (
            <React.Fragment key={comp.id}>
              <ConditionalYearHeader
                competitions={competitions}
                index={index}
                isSortedByAnnouncement={isSortedByAnnouncement}
                colSpan={8}
              />
              <Table.Row error={isCancelled(comp)} className="competition-info">
                <Table.Cell collapsing>
                  <StatusIcon
                    comp={comp}
                    shouldShowRegStatus={shouldShowRegStatus}
                    isSortedByAnnouncement={isSortedByAnnouncement}
                    regStatusLoading={regStatusLoading}
                  />
                </Table.Cell>
                <Table.Cell width={4}>
                  {comp.country_iso2 && <RegionFlag iso2={comp.country_iso2} />}
                  {' '}
                  <a href={competitionUrl(comp.id)}>{comp.short_display_name}</a>
                  <br />
                  <strong>{countries.byIso2[comp.country_iso2].name}</strong>
                  {`, ${comp.city}`}
                </Table.Cell>
                <Table.Cell width={3}>
                  <List verticalAlign="middle" link>
                    {comp.delegates.map((delegate) => (
                      <List.Item
                        key={delegate.id}
                        active={!selectedDelegate || delegate.id === selectedDelegate}
                        disabled
                      >
                        <Image avatar src={delegate.avatar.thumb_url} />
                        <List.Content as="a">{delegate.name}</List.Content>
                      </List.Item>
                    ))}
                  </List>
                </Table.Cell>
                <Table.Cell textAlign="center" width={3}>
                  {dateRange(comp.start_date, comp.end_date)}
                </Table.Cell>
                <Table.Cell
                  textAlign="center"
                  width={2}
                  positive={announcementStatus === 'ok'}
                  warning={announcementStatus === 'warning'}
                  error={announcementStatus === 'danger'}
                >
                  {comp.announced_at && timeDifferenceBefore(comp, comp.announced_at)}
                </Table.Cell>
                <Table.Cell
                  textAlign="center"
                  width={2}
                  positive={reportPostedStatus === 'ok'}
                  warning={reportPostedStatus === 'warning'}
                  error={reportPostedStatus === 'danger'}
                >
                  {reportAdminCellContent(comp)}
                </Table.Cell>
                <Table.Cell
                  textAlign="center"
                  width={2}
                  positive={resultsPostedStatus === 'ok' || resultsPostedStatus === 'semi_ok'}
                  disabled={resultsPostedStatus === 'semi_ok'}
                  warning={resultsPostedStatus === 'warning'}
                  error={resultsPostedStatus === 'danger'}
                >
                  {resultsSubmittedAtAdminCellContent(comp)}
                </Table.Cell>
                <Table.Cell collapsing>
                  <Button
                    compact
                    size="tiny"
                    secondary
                    as="a"
                    href={adminCompetitionUrl(comp.id)}
                    target="_blank"
                  >
                    Edit
                  </Button>
                </Table.Cell>
              </Table.Row>
            </React.Fragment>
          );
        })}
      </Table.Body>
    </Table>
  );
}

function ConditionalYearHeader({
  competitions,
  index,
  isSortedByAnnouncement,
  colSpan,
}) {
  if (
    index > 0
    && startYear(competitions[index])
      !== startYear(competitions[index - 1])
    && !isSortedByAnnouncement
  ) {
    return (
      <Table.Row>
        <Table.Cell textAlign="center" colSpan={colSpan} active>
          <Header>{startYear(competitions[index])}</Header>
        </Table.Cell>
      </Table.Row>
    );
  }
}

function RegistrationStatus({ comp, isLoading }) {
  // It is important that we check both conditions, because the query hook
  //   uses a `keepPreviousData` trick that holds existing data in-memory while
  //   also executing the query for the next batch of rows in the background.
  if (isLoading && !comp.registration_status) {
    return (<Loader active inline size="mini" />);
  }

  if (comp.registration_status === 'not_yet_opened') {
    return (
      <Popup
        trigger={<Icon name="clock" color="blue" />}
        content={
          I18n.t(
            'competitions.index.tooltips.registration.opens_in',
            {
              relativeDate: DateTime.fromISO(comp.registration_open).toRelative(
                toRelativeOptions.default,
              ),
            },
          )
        }
        position="top center"
        size="tiny"
      />
    );
  }

  if (comp.registration_status === 'past') {
    return (
      <Popup
        trigger={<Icon name="user times" color="red" />}
        content={
          I18n.t(
            'competitions.index.tooltips.registration.closed',
            {
              relativeDate: DateTime.fromISO(comp.start_date).toRelative(
                toRelativeOptions.roundUpAndAtBestDayPrecision,
              ),
            },
          )
        }
        position="top center"
        size="tiny"
      />
    );
  }

  if (comp.registration_status === 'full') {
    return (
      <Popup
        trigger={<Icon className="user clock" color="orange" />}
        content={I18n.t('competitions.index.tooltips.registration.full')}
        position="top center"
        size="tiny"
      />
    );
  }

  if (comp.registration_status === 'open') {
    return (
      <Popup
        trigger={<Icon name="user plus" color="green" />}
        content={I18n.t('competitions.index.tooltips.registration.open')}
        position="top center"
        size="tiny"
      />
    );
  }

  return (
    <Icon name="question circle" />
  );
}

function StatusIcon({
  comp,
  shouldShowRegStatus,
  isSortedByAnnouncement,
  regStatusLoading,
}) {
  let tooltipInfo = '';
  let iconClass = '';

  if (isProbablyOver(comp)) {
    if (hasResultsPosted(comp)) {
      tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.posted');
      iconClass = 'check circle';
    } else {
      tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.ended', { days: I18n.t('common.days', { count: dayDifferenceFromToday(comp.end_date) }) });
      iconClass = 'hourglass end';
    }
  } else if (isInProgress(comp)) {
    tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.in_progress');
    iconClass = 'hourglass half';
  } else if (shouldShowRegStatus) {
    return <RegistrationStatus comp={comp} isLoading={regStatusLoading} />;
  } else if (isSortedByAnnouncement) {
    const announcedAtLuxon = DateTime.fromISO(comp.announced_at);
    const announcedAtFormatted = announcedAtLuxon.toLocaleString(DateTime.DATETIME_MED);

    tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.announced_on', { announcement_date: announcedAtFormatted });
    iconClass = 'hourglass start';
  } else {
    tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.starts_in', { days: I18n.t('common.days', { count: dayDifferenceFromToday(comp.start_date) }) });
    iconClass = 'hourglass start';
  }

  return (
    <Popup
      trigger={<Icon name={iconClass} />}
      content={tooltipInfo}
      position="top center"
      size="tiny"
    />
  );
}

export default ListViewSection;
