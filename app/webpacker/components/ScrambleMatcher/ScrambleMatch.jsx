import React from 'react';
import { Icon, Table } from 'semantic-ui-react';
import { activityCodeToName } from '@wca/helpers';

export default function ScrambleMatch({ activeRound, assignedScrambleRoundWcif }) {
  const { scrambleSetCount } = activeRound;
  const assignedScrambles = assignedScrambleRoundWcif.scrambleSets || [];

  const expectedIndices = [...Array(scrambleSetCount).keys()];
  const extraIndices = assignedScrambles.length > scrambleSetCount
    ? [...Array(assignedScrambles.length - scrambleSetCount).keys()]
      .map((i) => i + scrambleSetCount)
    : [];

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Group Id</Table.HeaderCell>
          <Table.HeaderCell>Assigned Scrambles</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {expectedIndices.map((i) => {
          const scramble = assignedScrambles[i];
          const hasError = !scramble;
          return (
            <Table.Row key={`expected-${i}`} negative={hasError}>
              <Table.Cell>
                {activityCodeToName(activeRound.id)}
                , Group
                {i + 1}
                {hasError && (
                <>
                  <Icon name="exclamation triangle" />
                  {' '}
                  Missing scramble
                </>
                )}
              </Table.Cell>
              <Table.Cell>{scramble ? scramble.name : '—'}</Table.Cell>
            </Table.Row>
          );
        })}
        {extraIndices.map((i) => {
          const scramble = assignedScrambles[i];
          return (
            <Table.Row key={`extra-${i}`} negative>
              <Table.Cell>
                Extra scramble (without group)
                {' '}
                <Icon name="exclamation triangle" />
              </Table.Cell>
              <Table.Cell>{scramble.name}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
