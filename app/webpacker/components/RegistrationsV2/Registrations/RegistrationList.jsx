import { useQuery } from '@tanstack/react-query';
import React, {
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  Button, Flag, Icon, Message, Segment, Table,
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
import { countries, events } from '../../../lib/wca-data.js.erb';
import { EventSelector } from '../../wca/EventSelector';

const sortReducer = createSortReducer(['name', 'country', 'total']);

export default function RegistrationList({ competitionInfo, userId }) {
  const { isLoading: registrationsIsLoading, data: registrationsData, isError } = useQuery({
    queryKey: ['registrations', competitionInfo.id],
    queryFn: () => getConfirmedRegistrations(competitionInfo),
    retry: false,
  });

  const [psychSheetEvent, setPsychSheetEvent] = useState();
  const [psychSheetSortBy, setPsychSheetSortBy] = useState();
  const isPsychSheet = psychSheetEvent !== undefined;

  const onEventClick = (eventId) => {
    setPsychSheetEvent(eventId);
    const event = events.byId[eventId];
    setPsychSheetSortBy(event.recommendedFormat().sortBy);
  };
  const handleEventSelection = ({ type, eventId }) => {
    if (type === 'toggle_event') {
      onEventClick(eventId);
    } else {
      setPsychSheetEvent(undefined);
    }
  };

  const { isLoading: psychSheetIsLoading, data: psychSheetData } = useQuery({
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
    enabled: isPsychSheet,
  });

  // psychSheetData is only missing the country iso2, otherwise we wouldn't
  //  need to mix in registrationData
  const registrationsWithPsychSheetData = useMemo(() => {
    return psychSheetData?.sorted_rankings?.map((p) => {
      const registrationEntry = registrationsData?.find((r) => p.user_id === r.user_id) || {};
      return { ...p, ...registrationEntry };
    });
  }, [psychSheetData, registrationsData]);

  const userRowRef = useRef();
  const scrollToUser = () => userRowRef?.current?.scrollIntoView(
    { behavior: 'smooth', block: 'center' },
  );

  if (isError) {
    return (
      <Errored componentName="RegistrationList" />
    );
  }

  if (registrationsIsLoading || psychSheetIsLoading) {
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
      {isPsychSheet ? (
        <PsychSheet
          competitionInfo={competitionInfo}
          registrations={registrationsWithPsychSheetData}
          psychSheetEvent={psychSheetEvent}
          psychSheetSortBy={psychSheetSortBy}
          setPsychSheetSortBy={setPsychSheetSortBy}
          userId={userId}
          userRowRef={userRowRef}
          onScrollToMeClick={scrollToUser}
        />
      ) : (
        <Competitors
          competitionInfo={competitionInfo}
          registrations={registrationsData}
          onEventClick={onEventClick}
          userId={userId}
          userRowRef={userRowRef}
          onScrollToMeClick={scrollToUser}
        />
      )}
    </Segment>
  );
}

function Competitors({
  competitionInfo,
  registrations,
  onEventClick,
  userId,
  userRowRef,
  onScrollToMeClick,
}) {
  const [{ sortColumn, sortDirection }, sortDispatch] = useReducer(sortReducer, {
    sortColumn: 'name',
    sortDirection: 'ascending',
  });
  const changeSortColumn = (name) => sortDispatch({ type: 'CHANGE_SORT', sortColumn: name });

  // TODO: use react table
  const data = useMemo(() => {
    if (registrations) {
      let orderBy = [];
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
      const direction = sortDirection === 'descending' ? 'desc' : 'asc';

      return _.orderBy(registrations, orderBy, [direction]);
    }
    return [];
  }, [registrations, sortColumn, sortDirection]);

  const userRegistration = registrations?.find((row) => row.user_id === userId);
  const userIsInTable = Boolean(userRegistration);

  const registrationCount = registrations.length;
  const newcomerCount = registrations.filter(
    (reg) => !reg.user.wca_id,
  ).length;
  const returnerCount = registrationCount - newcomerCount;

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
            {competitionInfo.event_ids.map((id) => (
              <Table.HeaderCell
                key={`registration-table-header-${id}`}
                onClick={() => onEventClick(id)}
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
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.length > 0 ? (
            data.map((registration) => {
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
                    <Flag
                      name={registration.user.country.iso2.toLowerCase()}
                    />
                    {countries.byIso2[registration.user.country.iso2].name}
                  </Table.Cell>
                  {competitionInfo.event_ids.map((id) => (
                    <Table.Cell
                      key={`registration-table-row-${registration.user.id}-${id}`}
                    >
                      {registration.competing.event_ids.includes(id) && (
                        <EventIcon id={id} size="1em" hoverable={false} />
                      )}
                    </Table.Cell>
                  ))}
                  <Table.Cell>
                    {registration.competing.event_ids.length}
                  </Table.Cell>
                </Table.Row>
              );
            })
          ) : (
            <Table.Row>
              <Table.Cell
                textAlign="center"
                colSpan={competitionInfo.event_ids.length + 3}
              />
            </Table.Row>
          )}
        </Table.Body>
        <Footer
          registrations={registrations}
          isAllCompetitors
          competitionInfo={competitionInfo}
        />
      </Table>
    </>
  );
}

function PsychSheet({
  competitionInfo,
  registrations,
  psychSheetEvent,
  psychSheetSortBy,
  setPsychSheetSortBy,
  userId,
  userRowRef,
  onScrollToMeClick,
}) {
  const userRegistration = registrations.find((row) => row.user_id === userId);
  const userIsInTable = Boolean(userRegistration);
  const userPosition = userRegistration?.pos;

  const registrationCount = registrations.length;
  const newcomerCount = registrations.filter(
    (reg) => !reg.user.wca_id,
  ).length;
  const returnerCount = registrationCount - newcomerCount;

  return (
    <>
      <PreTableInfo
        scrollToMeIsShown={userIsInTable}
        userRankIsShown={userIsInTable && userPosition}
        userRank={userPosition ?? '-'}
        registrationCount={registrationCount}
        newcomerCount={newcomerCount}
        returnerCount={returnerCount}
        onScrollToMeClick={onScrollToMeClick}
      />
      <Table striped sortable unstackable compact singleLine textAlign="left">
        <PsychSheetHeader
          psychSheetEvent={psychSheetEvent}
          psychSheetSortBy={psychSheetSortBy}
          setPsychSheetSortBy={setPsychSheetSortBy}
        />
        <PsychSheetBody
          registrations={registrations}
          psychSheetEvent={psychSheetEvent}
          psychSheetSortBy={psychSheetSortBy}
          userId={userId}
          userRowRef={userRowRef}
        />
        <Footer
          registrations={registrations}
          competitionInfo={competitionInfo}
        />
      </Table>
    </>
  );
}

function PsychSheetHeader({
  psychSheetEvent,
  psychSheetSortBy,
  setPsychSheetSortBy,
}) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell disabled>
          <EventIcon id={psychSheetEvent} className="selected" size="1em" />
        </Table.HeaderCell>
        <Table.HeaderCell disabled>
          {I18n.t('activerecord.attributes.registration.name')}
        </Table.HeaderCell>
        <Table.HeaderCell disabled>
          {I18n.t('activerecord.attributes.user.country_iso2')}
        </Table.HeaderCell>
        <Table.HeaderCell disabled>
          <Icon name="trophy" />
          {' '}
          WR
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={psychSheetSortBy === 'single' ? 'ascending' : undefined}
          onClick={() => setPsychSheetSortBy('single')}
        >
          {I18n.t('common.single')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={psychSheetSortBy === 'average' ? 'ascending' : undefined}
          onClick={() => setPsychSheetSortBy('average')}
        >
          {I18n.t('common.average')}
        </Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}

function PsychSheetBody({
  registrations,
  psychSheetEvent,
  psychSheetSortBy,
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
              <Table.Cell
                collapsing
                textAlign="right"
                disabled={registration.tied_previous}
              >
                  {registration.pos}
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
                <Flag
                  name={registration.user.country.iso2.toLowerCase()}
                />
                {countries.byIso2[registration.user.country.iso2].name}
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
            </Table.Row>
          );
        })
      ) : (
        <Table.Row>
          <Table.Cell
            textAlign="center"
            colSpan={7}
          >
            {I18n.t('competitions.registration_v2.list.empty')}
          </Table.Cell>
        </Table.Row>
      )}
    </Table.Body>
  );
}

function Footer({
  registrations, isAllCompetitors, competitionInfo,
}) {
  if (!registrations) return null;

  const isPsychSheet = !isAllCompetitors;

  const registrationCount = registrations.length;

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
    <Table.Footer>
      <Table.Row>
        {isPsychSheet && (
          // psych sheet position
          <Table.Cell />
        )}
        <Table.Cell>
          {
            `${
              registrationCount
            } ${
              I18n.t('registrations.registration_info_people.person', { count: registrationCount })
            }`
          }
        </Table.Cell>
        <Table.Cell>{`${I18n.t('registrations.list.country_plural', { count: countryCount })}`}</Table.Cell>
        {isAllCompetitors ? (
          <>
            {competitionInfo.event_ids.map((evt) => (
              <Table.Cell key={`footer-count-${evt}`}>
                {eventCounts[evt]}
              </Table.Cell>
            ))}
            <Table.Cell>{totalEvents}</Table.Cell>
          </>
        ) : (
          // WR, single, average
          <>
            <Table.Cell />
            <Table.Cell />
            <Table.Cell />
          </>
        )}
      </Table.Row>
    </Table.Footer>
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

function PreTableInfo({
  scrollToMeIsShown,
  onScrollToMeClick = {},
  userRankIsShown,
  userRank = "-",
  registrationCount,
  newcomerCount,
  returnerCount,
}) {
  return (
    <Message>
      {scrollToMeIsShown && (
        <Button
          size="mini"
          onClick={onScrollToMeClick}
        >
          {I18n.t('competitions.registration_v2.list.psychsheets.show_me')}
        </Button>
      )}
      {' '}
      {userRankIsShown && (
        `${
          I18n.t(
            'competitions.registration_v2.list.psychsheets.rank',
            { userPosition: userRank },
          )
        }; `
      )}
      {
        `${
          newcomerCount
        } ${
          I18n.t('registrations.registration_info_people.newcomer', { count: newcomerCount })
        } + ${
          returnerCount
        } ${
          I18n.t('registrations.registration_info_people.returner', { count: returnerCount })
        } = ${
          registrationCount
        } ${
          I18n.t('registrations.registration_info_people.person', { count: registrationCount })
        }`
      }
    </Message>
  );
}
