import React from 'react';
import {
  Flag, Icon, Table,
} from 'semantic-ui-react';
import _ from 'lodash';
import EventIcon from '../../wca/EventIcon';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import I18n from '../../../lib/i18n';
import { countries } from '../../../lib/wca-data.js.erb';
import { EventSelector } from '../../wca/EventSelector';
import { getPeopleCounts, getTotals, getUserPositionInfo } from './utils';
import PreTableInfo from './PreTableInfo';

export default function PsychSheet({
  registrations,
  psychSheetEvent,
  psychSheetSortBy,
  setPsychSheetSortBy,
  userId,
  userRowRef,
  onScrollToMeClick,
}) {
  const { userIsInTable, userPosition } = getUserPositionInfo(
    registrations,
    userId,
  );

  const { registrationCount, newcomerCount, returnerCount } = getPeopleCounts(
    registrations,
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
          selectedEvent={psychSheetEvent}
          sortedColumn={psychSheetSortBy}
          onColumnClick={setPsychSheetSortBy}
        />
        <PsychSheetBody
          registrations={registrations}
          selectedEvent={psychSheetEvent}
          sortedColumn={psychSheetSortBy}
          userId={userId}
          userRowRef={userRowRef}
        />
        <PsychSheetFooter
          registrations={registrations}
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
