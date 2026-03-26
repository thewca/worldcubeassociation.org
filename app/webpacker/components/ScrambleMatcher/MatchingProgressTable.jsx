import { Icon, Table } from 'semantic-ui-react';
import React, { useCallback } from 'react';
import { shortLabelForActivityCode } from '../../lib/utils/wcif';
import {
  calculateEventExpectedCount,
  calculateEventMatchedCount,
  calculateRoundExpectedCount,
  calculateRoundMatchedCount,
} from './util';

function EventProgressRow({
  rowTitle,
  matchStateEvents,
  children,
  cellComponent: CellComponent = Table.Cell,
}) {
  return (
    <Table.Row>
      <CellComponent textAlign="right" singleLine>{rowTitle}</CellComponent>
      {matchStateEvents.map((evt) => (
        <CellComponent key={evt.id} textAlign="center" colSpan={evt.rounds.length}>
          {children(evt)}
        </CellComponent>
      ))}
    </Table.Row>
  );
}

function RoundsProgressRow({
  rowTitle,
  matchStateEvents,
  children,
  cellComponent: CellComponent = Table.Cell,
  progressValueFn = undefined,
  onCellClickFn = undefined,
}) {
  return (
    <Table.Row>
      <CellComponent textAlign="right" singleLine>{rowTitle}</CellComponent>
      {matchStateEvents.flatMap((evt) => evt.rounds.map((rd) => {
        const progressValue = progressValueFn?.(rd, evt);

        return (
          <CellComponent
            key={rd.id}
            textAlign="center"
            positive={progressValue === 'positive'}
            negative={progressValue === 'negative'}
            warning={progressValue === 'warning'}
            selectable={onCellClickFn !== undefined}
            onClick={() => onCellClickFn?.(rd, evt)}
          >
            {children(rd, evt)}
          </CellComponent>
        );
      }))}
    </Table.Row>
  );
}

export default function MatchingProgressTable({
  rootMatchState,
  unpackedScrSets,
  autoMatchSettings,
  navigatePicker,
}) {
  const calculateUploadedCount = useCallback(
    (event) => unpackedScrSets.filter((scrSet) => scrSet.event_id === event.id).length,
    [unpackedScrSets],
  );

  const calculateRoundExpectedCountForEvent = useCallback(
    (round, event) => calculateRoundExpectedCount(
      round,
      autoMatchSettings.useAttemptsMatching.includes(event.id),
    ),
    [autoMatchSettings.useAttemptsMatching],
  );

  const calculateRoundMatchedCountForEvent = useCallback(
    (round, event) => calculateRoundMatchedCount(
      round,
      autoMatchSettings.useAttemptsMatching.includes(event.id),
    ),
    [autoMatchSettings.useAttemptsMatching],
  );

  const getShortRoundLabel = (round) => shortLabelForActivityCode(round.id);

  const determineRoundProgress = useCallback((round, event) => {
    const isAttemptMode = autoMatchSettings.useAttemptsMatching.includes(event.id);

    const isExpected = calculateRoundExpectedCount(round, isAttemptMode);
    const isMatched = calculateRoundMatchedCount(round, isAttemptMode);

    if (isMatched < isExpected) {
      return 'negative';
    }

    if (isMatched > isExpected) {
      return 'warning';
    }

    return 'positive';
  }, [autoMatchSettings.useAttemptsMatching]);

  const navigateToCell = useCallback((round, event) => {
    navigatePicker('events', event.id);
    navigatePicker('rounds', round.id);
  }, [navigatePicker]);

  return (
    <Table basic="very" celled compact="very">
      <Table.Header>
        <EventProgressRow
          rowTitle={null}
          matchStateEvents={rootMatchState.events}
          cellComponent={Table.HeaderCell}
        >
          {(evt) => {
            const matchedCount = calculateEventMatchedCount(evt, autoMatchSettings);
            const expectedCount = calculateEventExpectedCount(evt, autoMatchSettings);

            const isMismatchError = matchedCount < expectedCount;
            const isMismatchWarning = matchedCount > expectedCount;

            const isMismatch = isMismatchError || isMismatchWarning;

            return (
              <Icon.Group size="large">
                <Icon className={`cubing-icon event-${evt.id}`} />
                {isMismatch && <Icon name="warning sign" corner color={isMismatchWarning ? 'yellow' : 'red'} />}
              </Icon.Group>
            );
          }}
        </EventProgressRow>
      </Table.Header>
      <Table.Body>
        <EventProgressRow
          rowTitle="Uploaded"
          matchStateEvents={rootMatchState.events}
        >
          {calculateUploadedCount}
        </EventProgressRow>
        <RoundsProgressRow
          rowTitle={null}
          matchStateEvents={rootMatchState.events}
          progressValueFn={determineRoundProgress}
          onCellClickFn={navigateToCell}
        >
          {getShortRoundLabel}
        </RoundsProgressRow>
        <RoundsProgressRow
          rowTitle="Expected"
          matchStateEvents={rootMatchState.events}
        >
          {calculateRoundExpectedCountForEvent}
        </RoundsProgressRow>
        <RoundsProgressRow
          rowTitle="Matched"
          matchStateEvents={rootMatchState.events}
        >
          {calculateRoundMatchedCountForEvent}
        </RoundsProgressRow>
      </Table.Body>
    </Table>
  );
}
