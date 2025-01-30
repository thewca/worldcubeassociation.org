import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  Flag, Icon, Segment, Table,
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
  userId,
  userRowRef,
  onScrollToMeClick,
}) {
  const { isLoading, data: rankings, isError } = useQuery({
    queryKey: [
      'psychSheet',
      competitionInfo.id,
      selectedEvent,
      sortedBy,
    ],
    queryFn: () => getPsychSheetForEvent(
      competitionInfo.id,
      selectedEvent,
      sortedBy,
    ),
    select: mapPsychSheetDate,
    retry: false,
  });

  if (isError) {
    return (
      <Errored componentName="PsychSheet" />
    );
  }

  if (isLoading) {
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
      <PreTableInfo
        scrollToMeIsShown={userIsInTable}
        userRankIsShown={userIsInTable}
        userRank={userPosition ?? '-'}
        registrationCount={registrationCount}
        newcomerCount={newcomerCount}
        returnerCount={returnerCount}
        onScrollToMeClick={onScrollToMeClick}
      />
      <Table striped sortable unstackable compact singleLine textAlign="left">
        <PsychSheetHeader
          selectedEvent={selectedEvent}
          sortedColumn={sortedBy}
          onColumnClick={setSortedBy}
        />
        <PsychSheetBody
          registrations={rankings}
          selectedEvent={selectedEvent}
          sortedColumn={sortedBy}
          userId={userId}
          userRowRef={userRowRef}
        />
        <PsychSheetFooter
          registrations={rankings}
        />
      </Table>
    </>
  );
}

function PsychSheetHeader({
  selectedEvent,
  sortedColumn,
  onColumnClick,
}) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell disabled>
          <EventIcon id={selectedEvent} className="selected" size="1em" />
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
          sorted={sortedColumn === 'single' ? 'ascending' : undefined}
          onClick={() => onColumnClick('single')}
        >
          {I18n.t('common.single')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={sortedColumn === 'average' ? 'ascending' : undefined}
          onClick={() => onColumnClick('average')}
        >
          {I18n.t('common.average')}
        </Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}

function PsychSheetBody({
  registrations,
  selectedEvent,
  sortedColumn,
  userId,
  userRowRef,
}) {
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
                {sortedColumn === 'single'
                  ? registration.single_rank
                  : registration.average_rank}
              </Table.Cell>
              <Table.Cell>
                {formatAttemptResult(registration.single_best, selectedEvent)}
              </Table.Cell>
              <Table.Cell>
                {formatAttemptResult(registration.average_best, selectedEvent)}
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

function PsychSheetFooter({
  registrations,
}) {
  const { registrationCount, countryCount } = getTotals(registrations);

  return (
    <Table.Footer>
      <Table.Row>
        <Table.Cell key="position" />
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
        <Table.Cell key="WR" />
        <Table.Cell key="single" />
        <Table.Cell key="average" />
      </Table.Row>
    </Table.Footer>
  );
}
