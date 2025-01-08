import { useQuery } from '@tanstack/react-query';
import React, {
  useMemo,
  useReducer,
  useState,
} from 'react';
import {
  Flag, Icon, Segment, Table,
} from 'semantic-ui-react';
import _ from 'lodash';
import {
  getConfirmedRegistrations,
  getPsychSheetForEvent,
} from '../api/registration/get/get_registrations';
import createSortReducer from '../reducers/sortReducer';
import Loading from '../../Requests/Loading';
import EventIcon from '../../wca/EventIcon';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import Errored from '../../Requests/Errored';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import I18n from '../../../lib/i18n';
import { countries } from '../../../lib/wca-data.js.erb';
import { EventSelector } from '../../wca/EventSelector';

const sortReducer = createSortReducer(['name', 'country', 'total']);

export default function RegistrationList({ competitionInfo }) {
  const { isLoading: registrationsLoading, data: registrations, isError } = useQuery({
    queryKey: ['registrations', competitionInfo.id],
    queryFn: () => getConfirmedRegistrations(competitionInfo),
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
  const handleEventSelection = ({ type, eventId }) => {
    setPsychSheetEvent(type === 'toggle_event' ? eventId : undefined);
  };

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

  const registrationsWithPsychSheet = useMemo(() => {
    if (psychSheet !== undefined) {
      setPsychSheetSortBy(psychSheet.sort_by);
      return psychSheet.sorted_rankings.map((p) => {
        const registrationEntry = registrations.find((r) => p.user_id === r.user_id);
        return { ...p, ...registrationEntry };
      });
    }
    return registrations;
  }, [psychSheet, registrations]);

  const data = useMemo(() => {
    if (registrationsWithPsychSheet) {
      let orderBy = [];
      if (psychSheetEvent === undefined) {
        switch (sortColumn) {
          case 'country':
            orderBy = [
              (item) => countries.byIso2[item.user.country.iso2].name,
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
        orderBy.push('user.name');
      }
      const direction = sortDirection === 'descending' ? 'desc' : 'asc';

      return _.orderBy(registrationsWithPsychSheet, orderBy, [direction]);
    }
    return [];
  }, [registrationsWithPsychSheet, sortColumn, sortDirection, psychSheetEvent]);

  if (isError) {
    return (
      <Errored componentName="RegistrationList" />
    );
  }

  if (registrationsLoading || isLoadingPsychSheet) {
    return (
      <Segment>
        <PsychSheetEventSelector
          handleEventSelection={handleEventSelection}
          eventList={competitionInfo.event_ids}
          selectedEvents={[psychSheetEvent].filter(Boolean)}
        />
        <Loading />
      </Segment>
    );
  }

  return (
    <Segment style={{ overflowX: 'scroll' }}>
      <PsychSheetEventSelector
        handleEventSelection={handleEventSelection}
        eventList={competitionInfo.event_ids}
        selectedEvents={[psychSheetEvent].filter(Boolean)}
      />
      <Table striped sortable unstackable compact singleLine textAlign="left">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell
              sorted={sortColumn === 'name' ? sortDirection : undefined}
              onClick={() => changeSortColumn('name')}
            >
              {I18n.t('activerecord.attributes.registration.name')}
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortColumn === 'country' ? sortDirection : undefined}
              onClick={() => changeSortColumn('country')}
            >
              {I18n.t('activerecord.attributes.user.country_iso2')}
            </Table.HeaderCell>
            {psychSheetEvent === undefined ? (
              <>
                {competitionInfo.event_ids.map((id) => (
                  <Table.HeaderCell
                    key={`registration-table-header-${id}`}
                  >
                    <EventIcon id={id} size="1em" className="selected" />
                  </Table.HeaderCell>
                ))}
                <Table.HeaderCell
                  sorted={sortColumn === 'total' ? sortDirection : undefined}
                  onClick={() => changeSortColumn('total')}
                >
                  {I18n.t('registrations.list.total')}
                </Table.HeaderCell>
              </>
            ) : (
              <>
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
                  {I18n.t('common.single')}
                </Table.HeaderCell>
                <Table.HeaderCell
                  sorted={
                    psychSheetSortBy === 'average' ? 'ascending' : undefined
                  }
                  onClick={() => setPsychSheetSortBy('average')}
                >
                  {I18n.t('common.average')}
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
                  {countries.byIso2[registration.user.country.iso2].name}
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
                {psychSheetEvent && I18n.t('competitions.registration_v2.list.empty')}
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
        <Table.Footer>
          <FooterContent
            registrations={registrationsWithPsychSheet}
            psychSheetEvent={psychSheetEvent}
            competitionInfo={competitionInfo}
          />
        </Table.Footer>
      </Table>
    </Segment>
  );
}

function FooterContent({
  registrations, psychSheetEvent, competitionInfo,
}) {
  if (!registrations) return null;

  const newcomerCount = registrations.filter(
    (reg) => !reg.user.wca_id,
  ).length;

  const countryCount = new Set(
    registrations.map((reg) => reg.user.country.iso2),
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
        {`${newcomerCount} ${I18n.t('registrations.registration_info_people.newcomer', { count: newcomerCount })} + ${
          registrations.length - newcomerCount
        } ${I18n.t('registrations.registration_info_people.returner', { count: registrations.length - newcomerCount })} =
         ${registrations.length} ${I18n.t('registrations.registration_info_people.person', { count: registrations.length })}`}
      </Table.Cell>
      <Table.Cell>{`${I18n.t('registrations.list.country_plural', { count: countryCount })}`}</Table.Cell>
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
        </>
      )}
    </Table.Row>
  );
}

function PsychSheetEventSelector({
  handleEventSelection,
  eventList,
  selectedEvents,
}) {
  return (
    <EventSelector
      onEventSelection={handleEventSelection}
      eventList={eventList}
      selectedEvents={selectedEvents}
      showBreakBeforeButtons={false}
      hideAllButton
      id="event-selection"
    />
  );
}
