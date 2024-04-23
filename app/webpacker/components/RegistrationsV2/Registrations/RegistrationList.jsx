import { useQuery } from '@tanstack/react-query';
import { formatCentiseconds } from '@wca/helpers';
import React, {
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { Flag, Icon, Table } from 'semantic-ui-react';
import {
  getConfirmedRegistrations,
  getPsychSheetForEvent,
} from '../api/registration/get/get_registrations';
import useWithUserData from '../hooks/useWithUserData';
import createSortReducer from '../reducers/sortReducer';
import { setMessage } from '../Register/RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import Loading from '../../Requests/Loading';
import EventIcon from '../../wca/EventIcon';
import { personUrl } from '../../../lib/requests/routes.js.erb';

const sortReducer = createSortReducer(['name', 'country', 'total']);

function FooterContent({
  dataWithUser, registrations, competitionInfo, psychSheetEvent,
}) {
  if (!dataWithUser || !registrations) return null;

  const newcomerCount = dataWithUser.filter(
    (reg) => reg.user.wca_id === undefined,
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
        {`${newcomerCount} First-Timers + ${
          dataWithUser.length - newcomerCount
        } Returners = ${dataWithUser.length} People`}
      </Table.Cell>
      <Table.Cell>{`${countryCount}  Countries`}</Table.Cell>
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
  const dispatchStore = useDispatch();
  const { isLoading: registrationsLoading, data: registrations } = useQuery({
    queryKey: ['registrations', competitionInfo.id],
    queryFn: () => getConfirmedRegistrations(competitionInfo.id),
    retry: false,
    onError: (data) => {
      const { error } = data.json;
      dispatchStore(setMessage(
        error
          ? `competitions.registration_v2.errors.${error}`
          : 'registrations.flash.failed',
        'negative',
      ));
    },
  });

  const [state, dispatch] = useReducer(sortReducer, {
    sortColumn: '',
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

  return registrationsLoading || userInfoLoading ? (
    <Loading />
  ) : (
    <div>
      <Table sortable textAlign="left">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell
              sorted={sortColumn === 'name' ? sortDirection : undefined}
              onClick={() => changeSortColumn('name')}
            >
              Name
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortColumn === 'country' ? sortDirection : undefined}
              onClick={() => changeSortColumn('country')}
            >
              Citizen Of
            </Table.HeaderCell>
            {psychSheetEvent === undefined ? (
              <>
                {competitionInfo.event_ids.map((id) => (
                  <Table.HeaderCell
                    key={`registration-table-header-${id}`}
                    onClick={() => setPsychSheetEvent(id)}
                  >
                    <EventIcon event={id} className="selected" />
                  </Table.HeaderCell>
                ))}
                <Table.HeaderCell
                  sorted={sortColumn === 'total' ? sortDirection : undefined}
                  onClick={() => changeSortColumn('total')}
                >
                  Total
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
                  Go back
                </Table.HeaderCell>
                <Table.HeaderCell>
                  <EventIcon event={psychSheetEvent} className="selected" />
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
                  Single
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={
                    psychSheetSortBy === 'average' ? 'ascending' : undefined
                  }
                  onClick={() => setPsychSheetSortBy('average')}
                >
                  Average
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
                          <EventIcon event={id} className="selected" />
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
                      {formatCentiseconds(registration.single_best)}
                    </Table.Cell>
                    <Table.Cell>
                      {formatCentiseconds(registration.average_best)}
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
                {psychSheetEvent && isLoadingPsychSheet
                  ? 'Crunching the data, please wait'
                  : 'No matching records found'}
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
    </div>
  );
}
