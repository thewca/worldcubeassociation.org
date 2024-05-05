import React from 'react';

import ResultForm from './Results/ResultForm/ResultForm';

function NewResult({
  result,
}) {
  return (
    <>
      <h3>Creating a new result</h3>
      <ResultForm result={result} sync={() => {}} />
    </>
  );
}

export default NewResult;
