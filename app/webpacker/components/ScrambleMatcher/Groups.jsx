import React, { useCallback, useMemo, useState } from 'react';
import { Button, Header } from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../lib/i18n';
import ScrambleMatch from './ScrambleMatch';

const scrambleToName = (scramble) => `Scramble ${scramble.scramble_number} (${scramble.scramble_string})`;

export default function Groups({
  scrambleSetCount,
  scrambleSets,
  dispatchMatchState,
}) {
  if (scrambleSetCount === 1) {
    return (
      <SelectedGroupPanel
        selectedGroupNumber={0}
        scrambleSets={scrambleSets}
        dispatchMatchState={dispatchMatchState}
      />
    );
  }
  return (
    <GroupsPicker
      scrambleSetCount={scrambleSetCount}
      scrambleSets={scrambleSets}
      dispatchMatchState={dispatchMatchState}
    />
  );
}

function GroupsPicker({ dispatchMatchState, scrambleSetCount, scrambleSets }) {
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
        />
      )}
    </>
  );
}

function SelectedGroupPanel({ dispatchMatchState, selectedGroupNumber, scrambleSets }) {
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
      matchableRows={scrambleSets[selectedGroupNumber].inbox_scrambles}
      onRowDragCompleted={onGroupDragCompleted}
      computeDefinitionName={groupScrambleToName}
      computeRowName={scrambleToName}
    />
  );
}
