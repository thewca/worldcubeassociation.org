import { Icon, Message, Table } from 'semantic-ui-react';
import React, { useCallback } from 'react';
import { shortLabelForActivityCode } from '../../lib/utils/wcif';

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
        const progressValue = progressValueFn?.(rd);

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
  uploadedScrambleFiles,
  navigatePicker,
}) {
  const uploadedScrSets = uploadedScrambleFiles
    .flatMap((scrFile) => scrFile.external_scramble_sets);

  const calculateUploadedCount = useCallback(
    (event) => uploadedScrSets.filter((scrSet) => scrSet.event_id === event.id).length,
    [uploadedScrSets],
  );

  const calculateRoundExpectedCount = useCallback(
    (round) => round.scrambleSetCount,
    [],
  );

  const calculateEventExpectedCount = useCallback(
    (event) => event.rounds.reduce((accu, rd) => accu + calculateRoundExpectedCount(rd), 0),
    [calculateRoundExpectedCount],
  );

  const calculateRoundMatchedCount = useCallback(
    (round) => round.external_scramble_sets.length,
    [],
  );

  const calculateEventMatchedCount = useCallback(
    (event) => event.rounds.reduce((accu, rd) => accu + calculateRoundMatchedCount(rd), 0),
    [calculateRoundMatchedCount],
  );

  const getShortRoundLabel = useCallback(
    (round) => shortLabelForActivityCode(round.id),
    [],
  );

  const determineRoundProgress = useCallback((round) => {
    const isExpected = calculateRoundExpectedCount(round);
    const isMatched = calculateRoundMatchedCount(round);

    if (isMatched < isExpected) {
      return 'negative';
    }

    if (isMatched > isExpected) {
      return 'warning';
    }

    return 'positive';
  }, [calculateRoundExpectedCount, calculateRoundMatchedCount]);

  const navigateToCell = useCallback((round, event) => {
    navigatePicker('events', event.id);
    navigatePicker('rounds', round.id);
  }, [navigatePicker]);

  if (uploadedScrambleFiles.length === 0) {
    return (
      <Message
        warning
        header="No scramble sets available"
        content="Upload some JSON files to get started!"
      />
    );
  }

  const totalMatchedCount = rootMatchState.events.reduce(
    (accu, evt) => accu + calculateEventExpectedCount(evt),
    0,
  );

  const hasAnyScrambles = totalMatchedCount > 0;

  if (!hasAnyScrambles) {
    return (
      <Message
        error
        header="No scramble sets matched at all"
      />
    );
  }

  return (
    <Table basic="very" celled="internally" compact="very">
      <Table.Header>
        <EventProgressRow
          rowTitle={null}
          matchStateEvents={rootMatchState.events}
          cellComponent={Table.HeaderCell}
        >
          {(evt) => {
            const matchedCount = calculateEventMatchedCount(evt);
            const expectedCount = calculateEventExpectedCount(evt);

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
          {calculateRoundExpectedCount}
        </RoundsProgressRow>
        <RoundsProgressRow
          rowTitle="Matched"
          matchStateEvents={rootMatchState.events}
        >
          {calculateRoundMatchedCount}
        </RoundsProgressRow>
      </Table.Body>
    </Table>
  );
}
