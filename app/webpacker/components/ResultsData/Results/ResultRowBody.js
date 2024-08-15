import React from 'react';
import ResultRow from './ResultRow';

function ResultRowBody({ results, adminMode }) {
  return (
    <>
      {results.map((result, index, iterResults) => (
        <ResultRow
          key={result.id}
          result={result}
          results={iterResults}
          index={index}
          adminMode={adminMode}
        />
      ))}
    </>
  );
}

export default ResultRowBody;
