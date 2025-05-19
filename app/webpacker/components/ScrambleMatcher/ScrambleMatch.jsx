import React from 'react';
import { activityCodeToName } from '@wca/helpers';
import useScrambleDrag from './useScrambleDrag';
import ScrambleDragTable from './ScrambleDragTable';
import { events, roundTypes } from '../../lib/wca-data.js.erb';

export default function ScrambleMatch({ activeRound, matchState, moveRoundScrambleSet }) {
  const { scrambleSetCount } = activeRound;
  const scrambles = matchState[activeRound.id] ?? [];

  const {
    onBeforeDragStart,
    onDragUpdate,
    onDragEnd,
    computeOnDragIndex,
  } = useScrambleDrag((from, to) => moveRoundScrambleSet(activeRound.id, from, to));

  return (
    <ScrambleDragTable
      scrambles={scrambles}
      expectedCount={scrambleSetCount}
      computeOnDragIndex={computeOnDragIndex}
      onBeforeDragStart={onBeforeDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
      renderLabel={({ definitionIndex, isExpected }) => (isExpected
        ? `${activityCodeToName(activeRound.id)}, Group ${definitionIndex + 1}`
        : 'Extra Scramble set (unassigned)')}
      renderDetails={({ scramble }) => `${events.byId[scramble.event_id].name} ${roundTypes.byId[scramble.round_type_id].name} - ${String.fromCharCode(64 + scramble.scramble_set_number)}`}
    />
  );
}
