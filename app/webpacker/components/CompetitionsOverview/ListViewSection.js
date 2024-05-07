import React from 'react';
import {
  List, Icon, Popup, Loader, Table, Flag,
} from 'semantic-ui-react';

import I18n from '../../lib/i18n';
import {
  dayDifferenceFromToday,
  hasResultsPosted,
  isCancelled,
  isInProgress,
  isProbablyOver,
  PseudoLinkMarkdown,
  startYear,
} from '../../lib/utils/competition-table';
import { countries } from '../../lib/wca-data.js.erb';

function ListViewSection({
  competitions,
  title,
  shouldShowRegStatus,
  isLoading,
  regStatusLoading,
  hasMoreCompsToLoad,
  isSortedByAnnouncement = false,
}) {
  return (
    <Table striped compact="very" basic="very">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan={5}>{`${title} (${competitions ? competitions.length : 0}${hasMoreCompsToLoad || isLoading ? '...' : ''})`}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {competitions?.map((comp, index) => (
          <React.Fragment key={comp.id}>
            <ConditionalYearHeader
              competitions={competitions}
              index={index}
              isSortedByAnnouncement={isSortedByAnnouncement}
            />
            <Table.Row error={isCancelled(comp)}>
              <Table.Cell collapsing>
                <StatusIcon
                  comp={comp}
                  shouldShowRegStatus={shouldShowRegStatus}
                  isSortedByAnnouncement={isSortedByAnnouncement}
                  regStatusLoading={regStatusLoading}
                />
              </Table.Cell>
              <Table.Cell width={2}>
                {comp.date_range}
              </Table.Cell>
              {/* <span class="competition-info"> currently missing from this layout */}
              <Table.Cell width={6}>
                <Flag name={comp.country_iso2?.toLowerCase()} />
                <a href={comp.url}>{comp.short_display_name}</a>
              </Table.Cell>
              <Table.Cell width={4}>
                <strong>{countries.byIso2[comp.country_iso2].name}</strong>
                {`, ${comp.city}`}
              </Table.Cell>
              <Table.Cell width={4}>
                <PseudoLinkMarkdown text={comp.venue} />
              </Table.Cell>
            </Table.Row>
          </React.Fragment>
        ))}
      </Table.Body>
    </Table>
  );
}

function ConditionalYearHeader({ competitions, index, isSortedByAnnouncement }) {
  if (
    index > 0
    && startYear(competitions[index])
      !== startYear(competitions[index - 1])
    && !isSortedByAnnouncement
  ) {
    return <List.Item style={{ textAlign: 'center', fontWeight: 'bold' }}>{startYear(competitions[index])}</List.Item>;
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
        content={I18n.t('competitions.index.tooltips.registration.opens_in', { duration: comp.time_until_registration })}
        position="top center"
        size="tiny"
      />
    );
  }
  if (comp.registration_status === 'past') {
    return (
      <Popup
        trigger={<Icon name="user times" color="red" />}
        content={I18n.t('competitions.index.tooltips.registration.closed', { days: I18n.t('common.days', { count: dayDifferenceFromToday(comp.start_date) }) })}
        position="top center"
        size="tiny"
      />
    );
  }
  if (comp.registration_status === 'full') {
    return (
      <Popup
        trigger={<Icon name="user clock" color="orange" />}
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
      iconClass = 'check circle result-posted-indicator';
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
    tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.announced_on', { announcement_date: comp.announced_at });
    iconClass = 'hourglass start';
  } else {
    tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.starts_in', { days: I18n.t('common.days', { count: dayDifferenceFromToday(comp.start_date) }) });
    iconClass = 'hourglass start';
  }

  return (
    <Popup
      trigger={<Icon className={iconClass} />}
      content={tooltipInfo}
      position="top center"
      size="tiny"
    />
  );
}

export default ListViewSection;
