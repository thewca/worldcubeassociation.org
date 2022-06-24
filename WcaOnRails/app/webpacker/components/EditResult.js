import React from 'react';

import useLoadedData from '../lib/hooks/useLoadedData';
import { resultUrl, competitionUrl } from '../lib/requests/routes.js.erb';

import Loading from './Requests/Loading';
import Errored from './Requests/Errored';
import ResultForm from './Results/ResultForm/ResultForm';
import ShowSingleResult from './Results/EditResult/ShowSingleResult';

function EditResult({
  id,
}) {
  const {
    data, sync, loading, error,
  } = useLoadedData(resultUrl(id));
  return (
    <>
      {error && (
        <Errored componentName="EditResult" />
      )}
      {loading && (
        <Loading />
      )}
      {data && (
        <>
          {!loading && (
            <>
              <h3>
                Result previously saved in the database
                {' '}
                -
                {' '}
                <a
                  href={competitionUrl(data.competition_id)}
                >
                  {data.competition_id}
                </a>
              </h3>
              <ShowSingleResult result={data} />
            </>
          )}
          <ResultForm result={data} sync={sync} />
        </>
      )}
    </>
  );
}

export default EditResult;
