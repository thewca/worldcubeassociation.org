import { Icon, Message, Table } from 'semantic-ui-react';
import React, { useCallback } from 'react';

function ProgressTableRow({
  rowTitle,
  matchStateEvents,
  children,
  cellComponent: CellComponent = Table.Cell,
}) {
  return (
    <Table.Row>
      <CellComponent textAlign="right">{rowTitle}</CellComponent>
      {matchStateEvents.map((evt) => (
        <CellComponent key={evt.id} textAlign="center">
          {children(evt)}
        </CellComponent>
      ))}
    </Table.Row>
  );
}

export default function MatchingProgressTable({
  rootMatchState,
  uploadedScrambleFiles,
}) {
  const uploadedScrSets = uploadedScrambleFiles
    .flatMap((scrFile) => scrFile.external_scramble_sets);

  const calculateUploadedCount = useCallback(
    (event) => uploadedScrSets.filter((scrSet) => scrSet.event_id === event.id).length,
    [uploadedScrSets],
  );

  const calculateExpectedCount = useCallback(
    (event) => event.rounds.reduce((accu, rd) => accu + rd.scrambleSetCount, 0),
    [],
  );

  const calculateMatchedCount = useCallback(
    (event) => event.rounds.reduce((accu, rd) => accu + rd.matchedScrambleSets.length, 0),
    [],
  );

  if (uploadedScrambleFiles.length === 0) {
    return (
      <Message
        warning
        header="No scramble sets available"
        content="Upload some JSON files to get started!"
      />
    );
  }

  const hasAnyScrambles = rootMatchState.events.some(
    (evt) => evt.rounds.some((rd) => rd.matchedScrambleSets.length > 0),
  );

  if (!hasAnyScrambles) {
    return (
      <Message
        error
        header="No scramble sets matched at all"
      />
    );
  }

  return (
    <Table basic="very" celled="internally">
      <Table.Header>
        <ProgressTableRow
          rowTitle="Progress"
          matchStateEvents={rootMatchState.events}
          cellComponent={Table.HeaderCell}
        >
          {(evt) => {
            const matchedCount = calculateMatchedCount(evt);
            const expectedCount = calculateExpectedCount(evt);

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
        </ProgressTableRow>
      </Table.Header>
      <Table.Body>
        <ProgressTableRow
          rowTitle="Uploaded"
          matchStateEvents={rootMatchState.events}
        >
          {calculateUploadedCount}
        </ProgressTableRow>
        <ProgressTableRow
          rowTitle="Expected"
          matchStateEvents={rootMatchState.events}
        >
          {calculateExpectedCount}
        </ProgressTableRow>
        <ProgressTableRow
          rowTitle="Matched"
          matchStateEvents={rootMatchState.events}
        >
          {calculateMatchedCount}
        </ProgressTableRow>
      </Table.Body>
    </Table>
  );
}
