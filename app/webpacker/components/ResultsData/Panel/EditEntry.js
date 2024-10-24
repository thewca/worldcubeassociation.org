import React from 'react';

import useLoadedData from '../../../lib/hooks/useLoadedData';
import { competitionUrl } from '../../../lib/requests/routes.js.erb';

import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';

function EditEntry({
  id,
  dataUrlFn,
  DisplayTable,
  EditForm,
  competitionIdKey = 'competition_id',
}) {
  const {
    data, sync, loading, error,
  } = useLoadedData(dataUrlFn(id));

  return (
    <>
      {error && <Errored componentName="EditEntry" />}
      {loading && <Loading />}
      {data && (
        <>
          {!loading && (
            <>
              <h3>
                Entry previously saved in the database
                {' '}
                -
                {' '}
                <a
                  href={competitionUrl(data[competitionIdKey])}
                >
                  {data[competitionIdKey]}
                </a>
              </h3>
              <DisplayTable dataItem={data} />
            </>
          )}
          <EditForm dataItem={data} sync={sync} />
        </>
      )}
    </>
  );
}

export default EditEntry;
