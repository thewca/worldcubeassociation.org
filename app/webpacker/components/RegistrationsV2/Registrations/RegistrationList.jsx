import { useQuery } from '@tanstack/react-query';
import React, {
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import {
  Flag, Icon, Segment, Table,
} from 'semantic-ui-react';
import {
  getConfirmedRegistrations,
  getPsychSheetForEvent,
} from '../api/registration/get/get_registrations';
import useWithUserData from '../hooks/useWithUserData';
import createSortReducer from '../reducers/sortReducer';
import Loading from '../../Requests/Loading';
import EventIcon from '../../wca/EventIcon';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import Errored from '../../Requests/Errored';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import i18n from '../../../lib/i18n';

const sortReducer = createSortReducer(['name', 'country', 'total']);

function FooterContent({
  dataWithUser, registrations, competitionInfo, psychSheetEvent,
}) {
  if (!dataWithUser || !registrations) return null;

  const newcomerCount = dataWithUser.filter(
    (reg) => !reg.user.wca_id,
  ).length;

  const countryCount = new Set(
    dataWithUser.map((reg) => reg.user.country.iso2),
  ).size;

  const eventCounts = Object.fromEntries(
    competitionInfo.event_ids.map((evt) => {
      const competingCount = registrations.filter(
        (reg) => reg.competing.event_ids.includes(evt),
      ).length;

      return [evt, competingCount];
    }),
  );

  const totalEvents = Object.values(eventCounts).reduce((a, b) => a + b, 0);

  return (
    <Table.Row>
      <Table.Cell>
        {`${newcomerCount} ${i18n.t('registrations.registration_info_people.newcomer', { count: newcomerCount })} + ${
          dataWithUser.length - newcomerCount
        } ${i18n.t('registrations.registration_info_people.returner', { count: dataWithUser.length - newcomerCount })} =
         ${dataWithUser.length} ${i18n.t('registrations.registration_info_people.person', { count: dataWithUser.length })}`}
      </Table.Cell>
      <Table.Cell>{`${i18n.t('registrations.list.country_plural', { count: countryCount })}`}</Table.Cell>
      {psychSheetEvent === undefined ? (
        <>
          {competitionInfo.event_ids.map((evt) => (
            <Table.Cell key={`footer-count-${evt}`}>
              {eventCounts[evt]}
            </Table.Cell>
          ))}
          <Table.Cell>{totalEvents}</Table.Cell>
        </>
      ) : (
        <>
          <Table.Cell />
          <Table.Cell />
          <Table.Cell />
          <Table.Cell />
          <Table.Cell />
        </>
      )}
    </Table.Row>
  );
}

export default function RegistrationList({ competitionInfo }) {
  const { isLoading: registrationsLoading, data: registrations, isError } = useQuery({
    queryKey: ['registrations', competitionInfo.id],
    queryFn: () => getConfirmedRegistrations(competitionInfo.id),
    retry: false,
  });

  const [state, dispatch] = useReducer(sortReducer, {
    sortColumn: 'name',
    sortDirection: undefined,
  });

  const { sortColumn, sortDirection } = state;
  const changeSortColumn = (name) => dispatch({ type: 'CHANGE_SORT', sortColumn: name });

  const [psychSheetEvent, setPsychSheetEvent] = useState();
  const [psychSheetSortBy, setPsychSheetSortBy] = useState('single');

  const { isLoading: isLoadingPsychSheet, data: psychSheet } = useQuery({
    queryKey: [
      'psychSheet',
      competitionInfo.id,
      psychSheetEvent,
      psychSheetSortBy,
    ],
    queryFn: () => getPsychSheetForEvent(
      competitionInfo.id,
      psychSheetEvent,
      psychSheetSortBy,
    ),
    retry: false,
    enabled: psychSheetEvent !== undefined,
  });

  useEffect(() => {
    if (psychSheet !== undefined) {
      setPsychSheetSortBy(psychSheet.sort_by);
    }
  }, [psychSheet]);

  const { isLoading: userInfoLoading, data: dataWithUser } = useWithUserData(
    (psychSheetEvent !== undefined
      ? psychSheet?.sorted_rankings
      : registrations) || [],
  );

  const data = useMemo(() => {
    if (dataWithUser) {
      const sorted = dataWithUser.toSorted((a, b) => {
        if (psychSheetEvent !== undefined) {
          return 0; // backend handles the sorting of psych sheets
        }
        if (sortColumn === 'name') {
          return a.user.name.localeCompare(b.user.name);
        }
        if (sortColumn === 'country') {
          return a.user.country.name.localeCompare(b.user.country.name);
        }
        if (sortColumn === 'total') {
          return a.competing.event_ids.length - b.competing.event_ids.length;
        }
        return 0;
      });
      if (sortDirection === 'descending') {
        return sorted.toReversed();
      }
      return sorted;
    }
    return [];
  }, [dataWithUser, sortColumn, sortDirection, psychSheetEvent]);

  if (isError) {
    return (
      <Errored componentName="RegistrationList" />
    );
  }

  if (registrationsLoading || userInfoLoading || isLoadingPsychSheet) {
    return (
      <Segment>
        <Loading />
      </Segment>
    );
  }

  return (
    <Segment style={{ overflowX: 'scroll' }}>
      <Table sortable unstackable singleLine textAlign="left">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell
              sorted={sortColumn === 'name' ? sortDirection : undefined}
              onClick={() => changeSortColumn('name')}
            >
              {i18n.t('activerecord.attributes.registration.name')}
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortColumn === 'country' ? sortDirection : undefined}
              onClick={() => changeSortColumn('country')}
            >
              {i18n.t('activerecord.attributes.user.country_iso2')}
            </Table.HeaderCell>
            {psychSheetEvent === undefined ? (
              <>
                {competitionInfo.event_ids.map((id) => (
                  <Table.HeaderCell
                    key={`registration-table-header-${id}`}
                    onClick={() => setPsychSheetEvent(id)}
                  >
                    <EventIcon id={id} size="1em" className="selected" />
                  </Table.HeaderCell>
                ))}
                <Table.HeaderCell
                  sorted={sortColumn === 'total' ? sortDirection : undefined}
                  onClick={() => changeSortColumn('total')}
                >
                  {i18n.t('registrations.list.total')}
                </Table.HeaderCell>
              </>
            ) : (
              <>
                <Table.HeaderCell
                  collapsing
                  onClick={() => setPsychSheetEvent(undefined)}
                >
                  <Icon name="backward" />
                  {' '}
                  {i18n.t('competitions.registration_v2.list.psychsheets.go_back')}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  <EventIcon id={psychSheetEvent} className="selected" size="1em" />
                </Table.HeaderCell>
                <Table.HeaderCell>
                  <Icon name="trophy" />
                  {' '}
                  WR
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={
                    psychSheetSortBy === 'single' ? 'ascending' : undefined
                  }
                  onClick={() => setPsychSheetSortBy('single')}
                >
                  {i18n.t('common.single')}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={
                    psychSheetSortBy === 'average' ? 'ascending' : undefined
                  }
                  onClick={() => setPsychSheetSortBy('average')}
                >
                  {i18n.t('common.average')}
                </Table.HeaderCell>
              </>
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.length > 0 ? (
            data.map((registration) => (
              <Table.Row key={`registration-table-row-${registration.user.id}`}>
                <Table.Cell>
                  {registration.user.wca_id ? (
                    <a
                      href={personUrl(registration.user.wca_id)}
                    >
                      {registration.user.name}
                    </a>
                  ) : (
                    registration.user.name
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Flag
                    name={registration.user.country.iso2.toLowerCase()}
                  />
                  {registration.user.country.name}
                </Table.Cell>
                {psychSheetEvent === undefined ? (
                  <>
                    {competitionInfo.event_ids.map((id) => (
                      <Table.Cell
                        key={`registration-table-row-${registration.user.id}-${id}`}
                      >
                        {registration.competing.event_ids.includes(id) ? (
                          <EventIcon id={id} size="1em" hoverable={false} />
                        ) : null}
                      </Table.Cell>
                    ))}
                    <Table.Cell>
                      {registration.competing.event_ids.length}
                    </Table.Cell>
                  </>
                ) : (
                  <>
                    <Table.Cell />
                    <Table.Cell
                      collapsing
                      textAlign="right"
                      disabled={registration.tied_previous}
                    >
                      {registration.pos}
                    </Table.Cell>
                    <Table.Cell>
                      {psychSheetSortBy === 'single'
                        ? registration.single_rank
                        : registration.average_rank}
                    </Table.Cell>
                    <Table.Cell>
                      {formatAttemptResult(registration.single_best, psychSheetEvent)}
                    </Table.Cell>
                    <Table.Cell>
                      {formatAttemptResult(registration.average_best, psychSheetEvent)}
                    </Table.Cell>
                  </>
                )}
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell
                textAlign="center"
                colSpan={
                  psychSheetEvent === undefined
                    ? competitionInfo.event_ids.length + 3
                    : 7
                }
              >
                {psychSheetEvent && i18n.t('competitions.registration_v2.list.empty')}
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
        <Table.Footer>
          <FooterContent
            registrations={registrations}
            psychSheetEvent={psychSheetEvent}
            dataWithUser={dataWithUser}
            competitionInfo={competitionInfo}
          />
        </Table.Footer>
      </Table>
    </Segment>
  );
}
