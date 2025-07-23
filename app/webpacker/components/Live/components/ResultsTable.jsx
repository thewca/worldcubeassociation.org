import { Table } from 'semantic-ui-react';
import React, { useMemo } from 'react';
import _ from 'lodash';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import { editRegistrationUrl, liveUrls } from '../../../lib/requests/routes.js.erb';

const advancingColor = '0, 230, 118';

const customOrderBy = (competitor, resultsByRegistrationId, sortBy) => {
  const competitorResult = resultsByRegistrationId[competitor.id];

  if (!competitorResult) {
    return competitor.id;
  }

  return competitorResult[sortBy];
};

export const rankingCellStyle = (result) => {
  if (result?.advancing) {
    return { backgroundColor: `rgb(${advancingColor})` };
  }

  if (result?.advancing_questionable) {
    return { backgroundColor: `rgba(${advancingColor}, 0.5)` };
  }

  return {};
};

export const recordTagStyle = (tag) => {
  const styles = {
    display: 'block',
    lineHeight: 1,
    padding: '0.3em 0.4em',
    borderRadius: '4px',
    fontWeight: 600,
    fontSize: '0.6em',
    position: 'absolute',
    top: '0px',
    right: '0px',
    transform: 'translate(110%, -40%)',
    color: 'rgb(255, 255, 255)',
  };

  switch (tag) {
    case 'WR': {
      styles.backgroundColor = 'rgb(244, 67, 54)';
      break;
    }
    case 'CR': {
      styles.backgroundColor = 'rgb(255, 235, 59)';
      break;
    }
    case 'NR': {
      styles.backgroundColor = 'rgb(0, 230, 118)';
      break;
    }
    case 'PR': {
      styles.backgroundColor = 'rgb(66, 66, 66)';
      break;
    }
    default: {
      return {};
    }
  }
  return styles;
};

export default function ResultsTable({
  results, event, competitors, competitionId, isAdmin = false, showEmpty = true,
}) {
  const resultsByRegistrationId = _.keyBy(results, 'registration_id');

  const sortedCompetitors = useMemo(() => {
    const { sortBy } = event.recommendedFormat();

    return _.orderBy(
      competitors,
      [
        (competitor) => customOrderBy(competitor, resultsByRegistrationId, sortBy === 'single' ? 'best' : 'average'),
        (competitor) => customOrderBy(competitor, resultsByRegistrationId, sortBy === 'single' ? 'average' : 'best'),
      ],
      ['asc', 'asc'],
    );
  }, [competitors, event, resultsByRegistrationId]);

  const solveCount = event.recommendedFormat().expectedSolveCount;
  const attemptIndexes = [...Array(solveCount).keys()];

  return (
    <Table basic="very" compact="very">
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell textAlign="right">#</Table.HeaderCell>
          { isAdmin && <Table.HeaderCell>Id</Table.HeaderCell> }
          <Table.HeaderCell>Competitor</Table.HeaderCell>
          {attemptIndexes.map((num) => (
            <Table.HeaderCell key={num} textAlign="right">
              {num + 1}
            </Table.HeaderCell>
          ))}
          <Table.HeaderCell textAlign="right">Average</Table.HeaderCell>
          <Table.HeaderCell textAlign="right">Best</Table.HeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {sortedCompetitors.map((competitor, index) => {
          const competitorResult = resultsByRegistrationId[competitor.id];
          const hasResult = Boolean(competitorResult);

          if (!showEmpty && !hasResult) {
            return null;
          }

          return (
            <Table.Row key={competitor.user_id}>
              <Table.Cell width={1} textAlign="right" style={rankingCellStyle(competitorResult)}>
                {index + 1}
              </Table.Cell>
              {isAdmin && (
              <Table.Cell>
                {competitor.registration_id}
              </Table.Cell>
              )}
              <Table.Cell>
                <a href={isAdmin ? editRegistrationUrl(competitor.id)
                  : liveUrls.personResults(competitionId, competitor.id)}
                >
                  {competitor.user.name}
                </a>
              </Table.Cell>
              {hasResult && competitorResult.attempts.map((attempt) => (
                <Table.Cell
                  textAlign="right"
                  key={`${competitor.user_id}-${attempt.attempt_number}`}
                >
                  {formatAttemptResult(attempt.result, event.id)}
                </Table.Cell>
              ))}
              {hasResult && (
              <>
                <Table.Cell textAlign="right" style={{ position: 'relative' }}>
                  {formatAttemptResult(competitorResult.average, event.id)}
                  {' '}
                  {!isAdmin
                    && (
                    <span style={recordTagStyle(competitorResult.average_record_tag)}>
                      {competitorResult.average_record_tag}
                    </span>
                    )}
                </Table.Cell>
                <Table.Cell textAlign="right" style={{ position: 'relative' }}>
                  {formatAttemptResult(competitorResult.best, event.id)}
                  {!isAdmin
                    && (
                    <span style={recordTagStyle(competitorResult.single_record_tag)}>
                      {competitorResult.single_record_tag}
                    </span>
                    )}
                </Table.Cell>
              </>
              )}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
