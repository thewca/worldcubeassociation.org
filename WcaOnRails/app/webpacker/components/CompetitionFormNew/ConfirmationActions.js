import { Button } from 'semantic-ui-react';
import React, { useMemo } from 'react';
import I18n from '../../lib/i18n';
import { useStore } from '../../lib/providers/StoreProvider';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  competitionConfirmationDataUrl,
  competitionUrl,
  confirmCompetitionUrl,
} from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import ConfirmProvider, { useConfirm } from '../../lib/providers/ConfirmProvider';
import useSaveAction from '../../lib/hooks/useSaveAction';

function CreateOrUpdateButton({
  createComp,
  updateComp,
}) {
  const { isPersisted } = useStore();

  if (isPersisted) {
    return <Button primary onClick={updateComp}>Update Competition</Button>;
  }

  return <Button primary onClick={createComp}>Create Competition</Button>;
}

function ConfirmButton({
  data,
  sync,
}) {
  const { canConfirm } = data;

  const {
    competition: {
      competitionId,
      admin: { isConfirmed },
    },
  } = useStore();

  const { save } = useSaveAction();
  const confirm = useConfirm();

  const confirmCompetition = () => {
    confirm({
      content: 'Do you really want to confirm the competition?',
    }).then(() => {
      save(confirmCompetitionUrl(competitionId), null, sync, {
        body: null,
        method: 'PUT',
      });
    });
  };

  if (isConfirmed || !canConfirm) return null;

  return (
    <Button
      positive
      onClick={confirmCompetition}
    >
      {I18n.t('competitions.competition_form.submit_confirm_value')}
    </Button>
  );
}

function DeleteButton({
  data,
  sync,
}) {
  const { cannotDeleteReason } = data;

  const {
    competition: {
      competitionId,
      admin: { isConfirmed },
    },
  } = useStore();

  const { save } = useSaveAction();
  const confirm = useConfirm();

  const deleteCompetition = () => {
    confirm({
      content: 'Do you really want to delete the competition?',
    }).then(() => {
      save(competitionUrl(competitionId), null, sync, {
        body: null,
        method: 'DELETE',
      });
    });
  };

  if (isConfirmed || cannotDeleteReason) return null;

  return (
    <Button
      negative
      onClick={deleteCompetition}
    >
      {I18n.t('competitions.competition_form.submit_delete_value')}
    </Button>
  );
}

export default function ConfirmationActions({
  createComp,
  updateComp,
}) {
  const { isAdminView, isPersisted, competition: { competitionId } } = useStore();

  const dataUrl = useMemo(() => competitionConfirmationDataUrl(competitionId), [competitionId]);

  const {
    data,
    loading,
    sync,
  } = useLoadedData(dataUrl);

  if (loading) return <Loading />;

  return (
    <ConfirmProvider>
      <Button.Group>
        <CreateOrUpdateButton createComp={createComp} updateComp={updateComp} />
        {isPersisted && !isAdminView && <ConfirmButton data={data} sync={sync} />}
        {isPersisted && <DeleteButton data={data} sync={sync} />}
      </Button.Group>
    </ConfirmProvider>
  );
}
