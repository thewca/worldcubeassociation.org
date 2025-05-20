import React, { useCallback, useMemo, useState } from 'react';
import { Button, Header } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import ScrambleMatch from './ScrambleMatch';

const scrambleToName = (scr) => scr.scramble_string;

export default function Groups({
  scrambleSetCount,
  scrambleSets,
  moveRoundScrambleSet,
}) {
  const [selectedGroupNumber, setSelectedGroupNumber] = useState(null);

  const availableEventIds = useMemo(
    () => Array.from({ length: scrambleSetCount }, (e, i) => i),
    [scrambleSetCount],
  );

  const groupScrambleToName = useCallback(
    (idx) => `Attempt ${idx + 1}`,
    [],
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
        {availableEventIds.map((num) => (
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
        <ScrambleMatch
          matchableRows={scrambleSets[selectedGroupNumber].inbox_scrambles}
          computeDefinitionName={groupScrambleToName}
          computeRowName={scrambleToName}
        />
      )}
    </>
  );
}
