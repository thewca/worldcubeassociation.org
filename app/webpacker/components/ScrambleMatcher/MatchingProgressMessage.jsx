import { Message } from 'semantic-ui-react';
import React from 'react';
import { humanizeActivityCode } from '../../lib/utils/wcif';

function ProgressErrors({
  progressErrors,
  title,
  children,
}) {
  if (progressErrors.length === 0) {
    return null;
  }

  return (
    <Message error>
      <Message.Header>{title}</Message.Header>
      <Message.List>
        {progressErrors.map((progressError, idx) => (
          <Message.Item key={progressError.id}>
            {children(progressError, idx)}
          </Message.Item>
        ))}
      </Message.List>
    </Message>
  );
}

export default function MatchingProgressMessage({
  roundMatchingProgress,
  availableScrambleFiles,
}) {
  if (availableScrambleFiles.length === 0) {
    return (
      <Message
        warning
        header="No scramble sets available"
        content="Upload some JSON files to get started!"
      />
    );
  }

  const hasAnyScrambles = roundMatchingProgress.some((roundProgress) => roundProgress.actual > 0);

  if (!hasAnyScrambles) {
    return (
      <Message
        error
        header="No scramble sets matched at all"
      />
    );
  }

  const missingScrambleSets = roundMatchingProgress.filter(
    (roundProgress) => roundProgress.actual < roundProgress.expected,
  );

  const missingScrambles = roundMatchingProgress.flatMap(
    (roundProgress) => roundProgress.scrambleSets.filter(
      (scrambleSetProgress) => scrambleSetProgress.actual < scrambleSetProgress.expected,
    ).map(
      (scrambleSetProgress) => ({
        ...scrambleSetProgress,
        roundId: roundProgress.id,
      }),
    ),
  );

  return (
    <>
      <ProgressErrors
        progressErrors={missingScrambleSets}
        title="Missing scramble sets"
      >
        {(progressError) => (
          <>
            Missing
            {' '}
            {progressError.actual === 0
              ? 'all'
              : (progressError.expected - progressError.actual).toString()}
            {' '}
            scramble set(s) for round
            {' '}
            {humanizeActivityCode(progressError.id)}
          </>
        )}
      </ProgressErrors>
      <ProgressErrors
        progressErrors={missingScrambles}
        title="Missing individual scrambles"
      >
        {(progressError) => (
          <>
            Missing
            {' '}
            {progressError.actual === 0
              ? 'all'
              : (progressError.expected - progressError.actual).toString()}
            {' '}
            scrambles for round
            {' '}
            {humanizeActivityCode(progressError.roundId)}
            {' '}
            in group
            {' '}
            {progressError.index + 1}
          </>
        )}
      </ProgressErrors>
    </>
  );
}
