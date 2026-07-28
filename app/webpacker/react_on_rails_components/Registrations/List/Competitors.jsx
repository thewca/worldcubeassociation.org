import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useReducer } from 'react';
import { Segment, Table } from 'semantic-ui-react';
import _ from 'lodash';
import {
  getConfirmedRegistrations,
} from '../api/registration/get/get_registrations';
import createSortReducer from '../reducers/sortReducer';
import EventIcon from '../../wca/EventIcon';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';
import { countries } from '../../../lib/wca-data.js.erb';
import { getPeopleCounts, getTotals, getUserPositionInfo } from './utils';
import PreTableInfo from './PreTableInfo';
import Errored from '../../Requests/Errored';
import Loading from '../../Requests/Loading';
import RegionFlag from '../../wca/RegionFlag';

const sortReducer = createSortReducer(['name', 'country', 'total']);

export default function Competitors({
  competitionInfo,
  eventIds,
  onEventClick,
  userId,
  userRowRef,
  onScrollToMeClick,
}) {
  const { isLoading, data: registrations, isError } = useQuery({
    queryKey: ['registrations', competitionInfo.id],
    queryFn: () => getConfirmedRegistrations(competitionInfo),
    retry: false,
  });

  const [sortState, sortDispatch] = useReducer(sortReducer, {
    sortColumn: 'name',
    sortDirection: 'ascending',
  });
  const { sortColumn: sortedColumn, sortDirection: sortedDirection } = sortState;
  const changeSortColumn = (name) => sortDispatch({ type: 'CHANGE_SORT', sortColumn: name });

  // TODO: use react table (future PR)
  const data = useMemo(() => {
    if (registrations) {
      let orderBy = [];
      switch (sortedColumn) {
        case 'country':
          orderBy = [
            (item) => countries.byIso2[item.user.country?.iso2]?.name,
          ];
          break;
        case 'total':
          orderBy = [
            (item) => item.competing.event_ids.length,
          ];
          break;
        default:
          break;
      }
      // always sort by user name as a fallback
      orderBy.push((item) => item.user.name.toLowerCase());
      const direction = sortedDirection === 'descending' ? 'desc' : 'asc';

      return _.orderBy(registrations, orderBy, [direction]);
    }
    return [];
  }, [registrations, sortedColumn, sortedDirection]);

  if (isError) {
    return (
      <Errored componentName="Competitors" />
    );
  }

  if (isLoading) {
    return (
      <Segment>
        <Loading />
      </Segment>
    );
  }

  const { userIsInTable } = getUserPositionInfo(registrations, userId);

  const { registrationCount, newcomerCount, returnerCount } = getPeopleCounts(
    registrations,
  );

  return (
    <>
      <PreTableInfo
        scrollToMeIsShown={userIsInTable}
        userRankIsShown={false}
        registrationCount={registrationCount}
        newcomerCount={newcomerCount}
        returnerCount={returnerCount}
        onScrollToMeClick={onScrollToMeClick}
      />
      <div style={{ overflowX: 'auto' }}>
        <Table striped sortable unstackable compact singleLine textAlign="left">
          <CompetitorsHeader
            eventIds={eventIds}
            sortedColumn={sortedColumn}
            sortedDirection={sortedDirection}
            onSortableColumnClick={changeSortColumn}
            onEventColumnClick={onEventClick}
          />
          <CompetitorsBody
            registrations={data}
            eventIds={eventIds}
            userId={userId}
            userRowRef={userRowRef}
          />
          <CompetitorsFooter
            registrations={registrations}
            eventIds={eventIds}
          />
        </Table>
      </div>
    </>
  );
}

function CompetitorsHeader({
  eventIds,
  sortedColumn,
  sortedDirection,
  onSortableColumnClick,
  onEventColumnClick,
}) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell
          sorted={sortedColumn === 'name' ? sortedDirection : undefined}
          onClick={() => onSortableColumnClick('name')}
        >
          {I18n.t('activerecord.attributes.registration.name')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={sortedColumn === 'country' ? sortedDirection : undefined}
          onClick={() => onSortableColumnClick('country')}
        >
          {I18n.t('activerecord.attributes.user.country_iso2')}
        </Table.HeaderCell>
        {eventIds.map((id) => (
          <Table.HeaderCell
            textAlign="center"
            key={`registration-table-header-${id}`}
            onClick={() => onEventColumnClick(id)}
          >
            <EventIcon id={id} size="1em" className="selected" />
          </Table.HeaderCell>
        ))}
        <Table.HeaderCell
          textAlign="center"
          sorted={sortedColumn === 'total' ? sortedDirection : undefined}
          onClick={() => onSortableColumnClick('total')}
        >
          {I18n.t('registrations.list.total')}
        </Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}

function CompetitorsBody({
  registrations,
  eventIds,
  userId,
  userRowRef,
}) {
  return (
    <Table.Body>
      {registrations.length > 0 ? (
        registrations.map((registration) => {
          const isUser = registration.user_id === userId;
          return (
            <Table.Row
              key={`registration-table-row-${registration.user.id}`}
              active={isUser}
            >
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
              {eventIds.map((id) => (
                <Table.Cell
                  textAlign="center"
                  key={`registration-table-row-${registration.user.id}-${id}`}
                >
                  {registration.competing.event_ids.includes(id) && (
                    <EventIcon id={id} size="1em" hoverable={false} />
                  )}
                </Table.Cell>
              ))}
              <Table.Cell textAlign="center">
                {registration.competing.event_ids.length}
              </Table.Cell>
            </Table.Row>
          );
        })
      ) : (
        <Table.Row>
          <Table.Cell
            textAlign="center"
            colSpan={eventIds.length + 3}
          />
        </Table.Row>
      )}
    </Table.Body>
  );
}

function CompetitorsFooter({
  registrations,
  eventIds,
}) {
  const {
    registrationCount, countryCount, eventCounts, eventCountsSum,
  } = getTotals(registrations, eventIds);

  return (
    <Table.Footer>
      <Table.Row>
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
        {eventIds.map((evt) => (
          <Table.Cell textAlign="center" key={`footer-count-${evt}`}>
            {eventCounts[evt]}
          </Table.Cell>
        ))}
        <Table.Cell textAlign="center">{eventCountsSum}</Table.Cell>
      </Table.Row>
    </Table.Footer>
  );
}
