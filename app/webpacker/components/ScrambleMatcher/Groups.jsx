import React, { useMemo, useState } from 'react';
import { Button, Header } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

export default function Groups({ scrambleSetCount, matchState, moveRoundScrambleSet }) {
  const [selectedGroupNumber, setSelectedGroupNumber] = useState(null);

  const availableEventIds = useMemo(
    () => Array.from({ length: scrambleSetCount }, (e, i) => i),
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
        <Header>Matcher for this group!</Header>
      )}
    </>
  );
}
