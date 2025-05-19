import React, { useMemo } from 'react';
import { activityCodeToName } from '@wca/helpers';
import useScrambleDrag from './useScrambleDrag';
import ScrambleDragTable from './ScrambleDragTable';
import { formats } from '../../lib/wca-data.js.erb';

export default function ScrambleAttemptMatch({ activeRound, matchState, moveRoundScrambleSet }) {
  const scrambles = useMemo(() => matchState[activeRound.id]?.[0]?.inbox_scrambles
    ?? [], [matchState, activeRound.id]);

  const expectedAttempts = formats.byId[activeRound.format].expectedSolveCount;

  const {
    onBeforeDragStart,
    onDragUpdate,
    onDragEnd,
    computeOnDragIndex,
  } = useScrambleDrag((from, to) => moveRoundScrambleSet(activeRound.id, from, to));

  return (
    <ScrambleDragTable
      scrambles={scrambles}
      expectedCount={expectedAttempts}
      computeOnDragIndex={computeOnDragIndex}
      onBeforeDragStart={onBeforeDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
      renderLabel={({ definitionIndex, isExpected }) => (isExpected
        ? `${activityCodeToName(activeRound.id)}, Attempt ${definitionIndex + 1}`
        : 'Extra Scramble (unassigned)')}
      renderDetails={({ scramble }) => `Attempt ${scramble.scramble_number}`}
    />
  );
}
