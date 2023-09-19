import _ from 'lodash';
import React from 'react';
import { centisecondsToString } from '../../../../lib/utils/edit-events';
import { roundIdToString } from '../../../../lib/utils/wcif';
import SelectRoundsModal from './SelectRoundsModal';

function RegulationLink({ regulation }) {
  return (
    <span>
      regulation
      {' '}
      <a href={`https://www.worldcubeassociation.org/regulations/#${regulation}`} target="_blank" rel="noreferrer">
        {regulation}
      </a>
    </span>
  );
}

function GuidelineLink({ guideline }) {
  return (
    <span>
      guideline
      {' '}
      <a href={`https://www.worldcubeassociation.org/regulations/guidelines.html#${guideline}`} target="_blank" rel="noreferrer">
        {guideline}
      </a>
    </span>
  );
}

export default function TimeLimitDescription({ wcifRound, timeLimit, onOk }) {
  if (timeLimit.cumulativeRoundIds.length === 0) {
    return `Competitors have ${centisecondsToString(timeLimit.centiseconds)} for each of their solves.`;
  }

  if (timeLimit.cumulativeRoundIds.length === 1) {
    return (
      <>
        <span>
          Competitors have
          {' '}
          {centisecondsToString(timeLimit.centiseconds)}
          {' '}
          total for all of their solves in this round.
          <br />
          This is called a cumulative time limit (see
          <RegulationLink regulation="A1a2" />
          ).
          <br />
          The button below allows you to share this cumulative time limit with other rounds (see
          <GuidelineLink guideline="A1a2++" />
          ).
        </span>
        <SelectRoundsModal excludeEventId={wcifRound.id.split('-')[0]} timeLimit={timeLimit} onOk={onOk} />
      </>
    );
  }

  const otherSelectedRoundIds = _.without(timeLimit.cumulativeRoundIds, wcifRound.id);

  return (
    <>
      <span>
        This round has a cross round cumulative time limit (see
        {' '}
        <GuidelineLink guideline="A1a2++" />
        ).
        <br />
        This means that competitors have
        {' '}
        {centisecondsToString(timeLimit.centiseconds)}
        {' '}
        total for all of their solves in this round (
        {roundIdToString(wcifRound.id)}
        ) shared with:
        <ul>
          {otherSelectedRoundIds.map((roundId) => (
            <li key={roundId}>{roundIdToString(roundId)}</li>
          ))}
        </ul>
      </span>
      <SelectRoundsModal excludeEventId={wcifRound.id.split('-')[0]} timeLimit={timeLimit} onOk={onOk} />
    </>
  );
}
