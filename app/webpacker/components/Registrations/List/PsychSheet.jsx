import { useQueries } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import {
  Button, Icon, Message, Segment, Table,
} from 'semantic-ui-react';
import {
  getPsychSheetForEvent,
} from '../api/registration/get/get_registrations';
import EventIcon from '../../wca/EventIcon';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import I18n from '../../../lib/i18n';
import { countries } from '../../../lib/wca-data.js.erb';
import { getPeopleCounts, getTotals, getUserPositionInfo } from './utils';
import PreTableInfo from './PreTableInfo';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';
import RegionFlag from '../../wca/RegionFlag';

// Positions, name, country, single world rank, and single result.
const BASE_COLUMN_COUNT = 6;
const AVERAGE_COLUMN_COUNT = 2;

// for consistency with competitors table data, to reuse helper functions
function mapPsychSheetDate(data) {
  return data.sorted_rankings.map((entry) => {
    const {
      name,
      user_id: userId,
      wca_id: wcaId,
      country_id: countryId,
      country_iso2: countryIso2,
      ...rest
    } = entry;

    return ({
      user: {
        name,
        id: userId,
        wca_id: wcaId,
        country: {
          id: countryId,
          iso2: countryIso2,
        },
      },
      ...rest,
    });
  });
}

export default function PsychSheet({
  competitionInfo,
  selectedEvent,
  sortedBy,
  setSortedBy,
  rankingPeriod,
  setRankingPeriod,
  userId,
  userRowRef,
  onScrollToMeClick,
}) {
  const eventIsMbf = selectedEvent === '333mbf';

  const [allTimeQuery, recentQuery] = useQueries({
    queries: ['all_time', 'last_12_months'].map((period) => ({
      queryKey: ['psychSheet', competitionInfo.id, selectedEvent, sortedBy, period],
      queryFn: () => getPsychSheetForEvent(competitionInfo.id, selectedEvent, sortedBy, period),
      select: mapPsychSheetDate,
      retry: false,
    })),
  });
  const sortsByAllTime = rankingPeriod === 'all_time' || !recentQuery.data;
  const rankings = useMemo(() => {
    if (!allTimeQuery.data) return [];
    if (sortsByAllTime) return allTimeQuery.data;
    const recentOrderByUserId = new Map(recentQuery.data.map((row, index) => [row.user.id, index]));
    return allTimeQuery.data.toSorted(
      (a, b) => (recentOrderByUserId.get(a.user.id) ?? Infinity)
        - (recentOrderByUserId.get(b.user.id) ?? Infinity),
    );
  }, [allTimeQuery.data, recentQuery.data, sortsByAllTime]);

  if (allTimeQuery.isError) {
    return (
      <Errored componentName="PsychSheet" />
    );
  }

  if (allTimeQuery.isPending) {
    return (
      <Segment>
        <Loading />
      </Segment>
    );
  }

  const { userIsInTable, userPosition } = getUserPositionInfo(
    rankings,
    userId,
  );

  const { registrationCount, newcomerCount, returnerCount } = getPeopleCounts(
    rankings,
  );

  return (
    <>
      <p>{I18n.t('competitions.registration_v2.list.psychsheets.ranking_comparison_hint')}</p>
      {recentQuery.isError && (
        <Message warning>
          {I18n.t('competitions.registration_v2.list.psychsheets.recent_rankings_unavailable')}
        </Message>
      )}
      <PreTableInfo
        scrollToMeIsShown={userIsInTable}
        userRankIsShown={userIsInTable}
        userRank={userPosition ?? '-'}
        registrationCount={registrationCount}
        newcomerCount={newcomerCount}
        returnerCount={returnerCount}
        onScrollToMeClick={onScrollToMeClick}
      />
      <div style={{ overflowX: 'auto' }}>
        <Table striped sortable unstackable compact singleLine textAlign="left">
          <PsychSheetHeader
            selectedEvent={selectedEvent}
            sortedColumn={sortedBy}
            onColumnClick={setSortedBy}
            hideAverage={eventIsMbf}
            sortsByAllTime={sortsByAllTime}
            setRankingPeriod={setRankingPeriod}
            hasRecentRankings={!!recentQuery.data}
          />
          <PsychSheetBody
            registrations={rankings}
            recentRankings={recentQuery.data}
            selectedEvent={selectedEvent}
            userId={userId}
            userRowRef={userRowRef}
            hideAverage={eventIsMbf}
            sortsByAllTime={sortsByAllTime}
          />
          <PsychSheetFooter
            registrations={rankings}
            hideAverage={eventIsMbf}
          />
        </Table>
      </div>
    </>
  );
}

function PsychSheetHeader({
  selectedEvent,
  sortedColumn,
  onColumnClick,
  hideAverage = false,
  sortsByAllTime,
  setRankingPeriod,
  hasRecentRankings,
}) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell aria-sort={sortsByAllTime ? 'ascending' : 'none'}>
          <Button basic compact onClick={() => setRankingPeriod('all_time')}>
            <EventIcon id={selectedEvent} className="selected" size="1em" />
            {' '}
            {I18n.t('competitions.registration_v2.list.psychsheets.position')}
            {/* Always render an icon so the column width stays stable when sorting. */}
            <Icon name={sortsByAllTime ? 'sort ascending' : 'sort'} />
          </Button>
        </Table.HeaderCell>
        <Table.HeaderCell aria-sort={sortsByAllTime ? 'none' : 'ascending'}>
          <Button basic compact disabled={!hasRecentRankings} onClick={() => setRankingPeriod('last_12_months')}>
            {I18n.t('competitions.registration_v2.list.psychsheets.position_last_12_months')}
            <Icon name={sortsByAllTime ? 'sort' : 'sort ascending'} />
          </Button>
        </Table.HeaderCell>
        <Table.HeaderCell disabled>
          {I18n.t('activerecord.attributes.registration.name')}
        </Table.HeaderCell>
        <Table.HeaderCell disabled>
          {I18n.t('activerecord.attributes.user.country_iso2')}
        </Table.HeaderCell>
        <Table.HeaderCell textAlign="right" disabled>
          <Icon name="trophy" />
          {' '}
          WR
        </Table.HeaderCell>
        <Table.HeaderCell
          textAlign="right"
          sorted={sortedColumn === 'single' ? 'ascending' : undefined}
          onClick={() => onColumnClick('single')}
          disabled={hideAverage}
        >
          {I18n.t('common.single')}
        </Table.HeaderCell>
        {hideAverage || (
          <>
            <Table.HeaderCell
              textAlign="right"
              sorted={sortedColumn === 'average' ? 'ascending' : undefined}
              onClick={() => onColumnClick('average')}
            >
              {I18n.t('common.average')}
            </Table.HeaderCell>
            <Table.HeaderCell textAlign="right" disabled>
              <Icon name="trophy" />
              {' '}
              WR
            </Table.HeaderCell>
          </>
        )}
      </Table.Row>
    </Table.Header>
  );
}

function PsychSheetBody({
  registrations,
  recentRankings,
  selectedEvent,
  userId,
  userRowRef,
  hideAverage = false,
  sortsByAllTime,
}) {
  const columnCount = BASE_COLUMN_COUNT + (hideAverage ? 0 : AVERAGE_COLUMN_COUNT);
  // Registrations can change between requests; missing counterparts have no position.
  const recentRankingsByUserId = useMemo(
    () => new Map(recentRankings?.map((row) => [row.user.id, row])),
    [recentRankings],
  );
  return (
    <Table.Body>
      {registrations.length > 0 ? (
        registrations.map((registration) => {
          const isUser = registration.user.id === userId;
          return (
            <Table.Row
              key={`registration-table-row-${registration.user.id}`}
              active={isUser}
            >
              <Table.Cell
                collapsing
                textAlign="right"
                disabled={sortsByAllTime && registration.tied_previous}
              >
                {registration.pos}
              </Table.Cell>
              <Table.Cell
                collapsing
                textAlign="right"
                disabled={!sortsByAllTime
                  && recentRankingsByUserId.get(registration.user.id)?.tied_previous}
              >
                {recentRankings ? (recentRankingsByUserId.get(registration.user.id)?.pos ?? '—') : ''}
              </Table.Cell>
              <Table.Cell>
                <div ref={isUser ? userRowRef : undefined}>
                  {registration.user.wca_id ? (
                    <a
                      href={personUrl(registration.user.wca_id)}
                    >
                      {registration.user.name}
                    </a>
                  ) : (
                    registration.user.name
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                {registration.user.country?.iso2 && (
                  <>
                    <RegionFlag iso2={registration.user.country.iso2} withoutTooltip />
                    {' '}
                    {countries.byIso2[registration.user.country.iso2].name}
                  </>
                )}
              </Table.Cell>
              <Table.Cell textAlign="right">
                {registration.single_rank}
              </Table.Cell>
              <Table.Cell textAlign="right">
                {formatAttemptResult(registration.single_best, selectedEvent)}
              </Table.Cell>
              {hideAverage || (
                <>
                  <Table.Cell textAlign="right">
                    {formatAttemptResult(registration.average_best, selectedEvent)}
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    {registration.average_rank}
                  </Table.Cell>
                </>
              )}
            </Table.Row>
          );
        })
      ) : (
        <Table.Row>
          <Table.Cell
            textAlign="center"
            colSpan={columnCount}
          >
            {I18n.t('competitions.registration_v2.list.empty')}
          </Table.Cell>
        </Table.Row>
      )}
    </Table.Body>
  );
}

function PsychSheetFooter({
  registrations,
  hideAverage = false,
}) {
  const { registrationCount, countryCount } = getTotals(registrations);

  return (
    <Table.Footer>
      <Table.Row>
        <Table.Cell key="position" />
        <Table.Cell key="recent-position" />
        <Table.Cell>
          {
            `${
              registrationCount
            } ${
              I18n.t('registrations.registration_info_people.person', { count: registrationCount })
            }`
          }
        </Table.Cell>
        <Table.Cell>
          {`${I18n.t('registrations.list.country_plural', { count: countryCount })}`}
        </Table.Cell>
        <Table.Cell key="single-world-rank" />
        <Table.Cell key="single" />
        {hideAverage || (
          <>
            <Table.Cell key="average" />
            <Table.Cell key="average-world-rank" />
          </>
        )}
      </Table.Row>
    </Table.Footer>
  );
}
