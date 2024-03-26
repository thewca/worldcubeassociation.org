import React from 'react';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import BoardEditor from './BoardEditor';

export default function BoardEditorPage() {
  const {
    data: boardRoles, loading, error, sync,
  } = useLoadedData(
    apiV0Urls.userRoles.listOfGroupType(groupTypes.board, 'name', {
      isActive: true,
    }),
  );

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return <BoardEditor boardRoles={boardRoles} sync={sync} />;
}
