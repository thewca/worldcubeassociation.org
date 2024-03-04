import React from 'react';
import { Table } from 'semantic-ui-react';
import ResultRow from '../../CompetitionResults/ResultRow';
import ResultRowHeader from '../../CompetitionResults/ResultRowHeader';

function ShowSingleResult({ result }) {
  return (
    <div className="competition-results">
      <Table striped className="event-results">
        <Table.Header>
          <ResultRowHeader />
        </Table.Header>
        <Table.Body>
          <ResultRow result={result} results={[result]} index={0} />
        </Table.Body>
      </Table>
    </div>
  );
}

export default ShowSingleResult;
