import React from 'react';
import {
  List, Icon, Popup, Loader,
} from 'semantic-ui-react';

import I18n from '../../lib/i18n';
import calculateDayDifference from '../../lib/utils/competition-table';

function CompetitionTable({
  competitionData,
  title,
  shouldShowRegStatus,
  shouldShowCancelled,
  selectedEvents,
  isLoading,
  hasMoreCompsToLoad,
  isSortedByAnnouncement = false,
  isRenderedAboveAnotherTable = false,
}) {
  const competitions = competitionData?.filter((comp) => (!comp.cancelled_at || shouldShowCancelled)
    && (selectedEvents.every((event) => comp.event_ids.includes(event))));

  return (
    <List divided relaxed>
      <List.Item>
        <strong>
          {`${title} (${competitions ? competitions.length : 0}${hasMoreCompsToLoad ? '...' : ''})`}
        </strong>
      </List.Item>
      {competitions?.map((comp, index) => (
        <React.Fragment key={comp.id}>
          <ConditionalYearHeader
            competitions={competitions}
            index={index}
            isSortedByAnnouncement={isSortedByAnnouncement}
          />
          <List.Item className={`${comp.isProbablyOver ? ' past' : ' not-past'}${comp.cancelled_at ? ' cancelled' : ''}`}>
            <span className="date">
              <DateIcon
                comp={comp}
                shouldShowRegStatus={shouldShowRegStatus}
                isSortedByAnnouncement={isSortedByAnnouncement}
              />
              {comp.dateRange}
            </span>
            <span className="competition-info">
              <div className="competition-link">
                <span className={` fi fi-${comp.country_iso2}`} />
                &nbsp;
                <a href={comp.url}>{comp.displayName}</a>
              </div>
              <div className="location">
                <strong>{comp.countryName}</strong>
                {`, ${comp.cityName}`}
              </div>
              <div className="venue-link">
                <VenueMarkdown venueText={comp.venue} />
              </div>
            </span>
          </List.Item>
        </React.Fragment>
      ))}
      {/* Could not figure out why Semantic UI's animated loader icon doesn't show */}
      {
        isLoading
        && (
          <List.Item style={{ textAlign: 'center' }}>
            <Loader active inline="centered" size="small">
              {I18n.t('competitions.index.loading_comps')}
            </Loader>
          </List.Item>
        )
      }
      {
        !hasMoreCompsToLoad
        && !isLoading
        && !isRenderedAboveAnotherTable
        && <FinishedLoadingCompsMsg numCompetitions={competitions?.length} />
      }
    </List>
  );
}

function ConditionalYearHeader({ competitions, index, isSortedByAnnouncement }) {
  if (index > 0 && competitions[index].year !== competitions[index - 1].year
    && !isSortedByAnnouncement) {
    return <List.Item style={{ textAlign: 'center', fontWeight: 'bold' }}>{competitions[index].year}</List.Item>;
  }
}

function RegistrationStatus({ comp }) {
  if (comp.registration_status === 'not_yet_opened') {
    return (
      <Popup
        trigger={<Icon className="clock blue" />}
        content={I18n.t('competitions.index.tooltips.registration.opens_in', { duration: comp.timeUntilRegistration })}
        position="top center"
        size="tiny"
      />
    );
  }
  if (comp.registration_status === 'past') {
    return (
      <Popup
        trigger={<Icon className="user times red" />}
        content={I18n.t('competitions.index.tooltips.registration.closed', { days: I18n.t('common.days', { count: calculateDayDifference(comp.start_date, comp.end_date, 'future') }) })}
        position="top center"
        size="tiny"
      />
    );
  }
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

function DateIcon({ comp, shouldShowRegStatus, isSortedByAnnouncement }) {
  let tooltipInfo = '';
  let iconClass = '';

  if (comp.isProbablyOver) {
    if (comp.resultsPosted) {
      tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.posted');
      iconClass = 'check circle result-posted-indicator';
    } else {
      tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.ended', { days: I18n.t('common.days', { count: calculateDayDifference(comp.start_date, comp.end_date, 'past') }) });
      iconClass = 'hourglass end';
    }
  } else if (comp.inProgress) {
    tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.in_progress');
    iconClass = 'hourglass half';
  } else if (isSortedByAnnouncement) {
    tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.announced_on', { announcement_date: comp.announcedDate });
    iconClass = 'hourglass start';
  } else if (shouldShowRegStatus) {
    return <RegistrationStatus comp={comp} />;
  } else {
    tooltipInfo = I18n.t('competitions.index.tooltips.hourglass.starts_in', { days: I18n.t('common.days', { count: calculateDayDifference(comp.start_date, comp.end_date, 'future') }) });
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

// Currently, the venue attribute of a competition object can be written as markdown,
// and using third party libraries like react-markdown to parse it requires to much work
function VenueMarkdown({ venueText }) {
  const openBracketIndex = venueText.indexOf('[');
  const closeBracketIndex = venueText.indexOf(']', openBracketIndex);
  const openParenIndex = venueText.indexOf('(', closeBracketIndex);
  const closeParenIndex = venueText.indexOf(')', openParenIndex);

  if (openBracketIndex === -1 || closeBracketIndex === -1
    || openParenIndex === -1 || closeParenIndex === -1) {
    return <p>{venueText}</p>;
  }

  return (
    <a href={venueText.slice(openParenIndex + 1, closeParenIndex)} target="_blank" rel="noreferrer">
      <p>{venueText.slice(openBracketIndex + 1, closeBracketIndex)}</p>
    </a>
  );
}

function FinishedLoadingCompsMsg({ numCompetitions }) {
  return (
    <List.Item style={{ textAlign: 'center' }}>
      {numCompetitions > 0 ? I18n.t('competitions.index.no_more_comps') : I18n.t('competitions.index.no_comp_found')}
    </List.Item>
  );
}

export default CompetitionTable;
