import React from 'react';
import {
  List, Icon, Popup,
} from 'semantic-ui-react';

import I18n from '../../lib/i18n';
import {
  dayDifferenceFromToday, hasResultsPosted, isCancelled, isInProgress,
  isProbablyOver, isRegistrationClosedAlready, isRegistrationOpenYet,
  PseudoLinkMarkdown, startYear,
} from '../../lib/utils/competition-table';
import { countries } from '../../lib/wca-data.js.erb';

function ListViewSection({
  competitions,
  title,
  shouldShowRegStatus,
  isLoading,
  hasMoreCompsToLoad,
  isSortedByAnnouncement = false,
}) {
  return (
    <List divided relaxed>
      <List.Item>
        <strong>
          {`${title} (${competitions ? competitions.length : 0}${hasMoreCompsToLoad || isLoading ? '...' : ''})`}
        </strong>
      </List.Item>
      {competitions?.map((comp, index) => (
        <React.Fragment key={comp.id}>
          <ConditionalYearHeader
            competitions={competitions}
            index={index}
            isSortedByAnnouncement={isSortedByAnnouncement}
          />
          <List.Item className={`${isProbablyOver(comp) ? ' past' : ' not-past'}${isCancelled(comp) ? ' cancelled' : ''}`}>
            <span className="date">
              <StatusIcon
                comp={comp}
                shouldShowRegStatus={shouldShowRegStatus}
                isSortedByAnnouncement={isSortedByAnnouncement}
              />
              {comp.date_range}
            </span>
            <span className="competition-info">
              <div className="competition-link">
                <span className={` fi fi-${comp.country?.iso2?.toLowerCase()}`} />
                &nbsp;
                <a href={comp.url}>{comp.short_display_name}</a>
              </div>
              <div className="location">
                <strong>{countries.byIso2[comp.country_iso2].name}</strong>
                {`, ${comp.city}`}
              </div>
              <div className="venue-link">
                <PseudoLinkMarkdown text={comp.venue} />
              </div>
            </span>
          </List.Item>
        </React.Fragment>
      ))}
    </List>
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

function RegistrationStatus({ comp }) {
  if (!isRegistrationOpenYet(comp)) {
    return (
      <Popup
        trigger={<Icon className="clock blue" />}
        content={I18n.t('competitions.index.tooltips.registration.opens_in', { duration: comp.time_until_registration })}
        position="top center"
        size="tiny"
      />
    );
  }
  if (isRegistrationClosedAlready(comp)) {
    return (
      <Popup
        trigger={<Icon className="user times red" />}
        content={I18n.t('competitions.index.tooltips.registration.closed', { days: I18n.t('common.days', { count: dayDifferenceFromToday(comp.start_date) }) })}
        position="top center"
        size="tiny"
      />
    );
  }
  // TODO: This is currently not implemented because the query is *way* to expensive to execute
  //   by default on production. We need to figure out a clever way to fetch this data on-demand.
  if (comp.registration_status === 'full') {
    return (
      <Popup
        trigger={<Icon className="user clock orange" />}
        content={I18n.t('competitions.index.tooltips.registration.full')}
        position="top center"
        size="tiny"
      />
    );
  }

  return (
    <Popup
      trigger={<Icon className="user plus green" />}
      content={I18n.t('competitions.index.tooltips.registration.open')}
      position="top center"
      size="tiny"
    />
  );
}

function StatusIcon({ comp, shouldShowRegStatus, isSortedByAnnouncement }) {
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
    return <RegistrationStatus comp={comp} />;
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
