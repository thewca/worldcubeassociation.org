import React, { useCallback, useMemo, useState } from 'react';
import { Button, Header } from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../lib/i18n';
import ScrambleMatch from './ScrambleMatch';

const scrambleToName = (scramble) => `Scramble ${scramble.scramble_number} (${scramble.scramble_string})`;

export default function Groups({
  scrambleSetCount,
  scrambleSets,
  expectedSolveCount,
  dispatchMatchState,
}) {
  if (scrambleSetCount === 1) {
    return (
      <SelectedGroupPanel
        selectedGroupNumber={0}
        scrambleSets={scrambleSets}
        expectedSolveCount={expectedSolveCount}
        dispatchMatchState={dispatchMatchState}
      />
    );
  }

  return (
    <GroupsPicker
      scrambleSetCount={scrambleSetCount}
      scrambleSets={scrambleSets}
      expectedSolveCount={expectedSolveCount}
      dispatchMatchState={dispatchMatchState}
    />
  );
}

function GroupsPicker({
  dispatchMatchState,
  scrambleSetCount,
  scrambleSets,
  expectedSolveCount,
}) {
  const [selectedGroupNumber, setSelectedGroupNumber] = useState(null);

  const availableGroups = useMemo(
    () => _.times(scrambleSetCount),
    [scrambleSetCount],
  );

  return (
    <>
      <Header as="h4">
        Groups
        {' '}
        <Button
          size="mini"
          id="clear-all-groups"
          onClick={() => setSelectedGroupNumber(null)}
        >
          {I18n.t('competitions.index.clear')}
        </Button>
      </Header>
      <Button.Group>
        {availableGroups.map((num) => (
          <Button
            key={num}
            toggle
            basic
            active={num === selectedGroupNumber}
            onClick={() => setSelectedGroupNumber(num)}
          >
            Group
            {' '}
            {num + 1}
          </Button>
        ))}
      </Button.Group>
      {selectedGroupNumber !== null && (
        <SelectedGroupPanel
          dispatchMatchState={dispatchMatchState}
          selectedGroupNumber={selectedGroupNumber}
          scrambleSets={scrambleSets}
          expectedSolveCount={expectedSolveCount}
        />
      )}
    </>
  );
}

function SelectedGroupPanel({
  dispatchMatchState,
  scrambleSets = [],
  selectedGroupNumber,
  expectedSolveCount,
}) {
  const onGroupDragCompleted = useCallback(
    (fromIndex, toIndex) => dispatchMatchState({
      type: 'moveScrambleInSet',
      setNumber: selectedGroupNumber,
      fromIndex,
      toIndex,
    }),
    [dispatchMatchState, selectedGroupNumber],
  );

  const groupScrambleToName = useCallback(
    (idx) => `Attempt ${idx + 1}`,
    [],
  );

  return (
    <ScrambleMatch
      matchableRows={scrambleSets[selectedGroupNumber]?.inbox_scrambles}
      expectedNumOfRows={expectedSolveCount}
      onRowDragCompleted={onGroupDragCompleted}
      computeDefinitionName={groupScrambleToName}
      computeRowName={scrambleToName}
    />
  );
}
