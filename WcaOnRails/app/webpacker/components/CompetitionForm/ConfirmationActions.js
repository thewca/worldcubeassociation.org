import { Button } from 'semantic-ui-react';
import React, { useMemo } from 'react';
import I18n from '../../lib/i18n';
import { useDispatch, useStore } from '../../lib/providers/StoreProvider';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  competitionConfirmationDataUrl,
  competitionUrl,
  confirmCompetitionUrl, homepageUrl,
} from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import ConfirmProvider, { useConfirm } from '../../lib/providers/ConfirmProvider';
import useSaveAction from '../../lib/hooks/useSaveAction';
import { changesSaved, updateFormValue } from './store/actions';

export function CreateOrUpdateButton({
  createComp,
  updateComp,
}) {
  const { isPersisted } = useStore();

  if (isPersisted) {
    return (
      <Button primary onClick={updateComp}>
        {I18n.t('competitions.competition_form.submit_update_value')}
      </Button>
    );
  }

  return (
    <Button primary onClick={createComp}>
      {I18n.t('competitions.competition_form.submit_create_value')}
    </Button>
  );
}

function ConfirmButton({
  competitionId,
  data,
  sync,
}) {
  const { canConfirm } = data;

  const { save } = useSaveAction();
  const confirm = useConfirm();

  const dispatch = useDispatch();

  const confirmCompetition = () => {
    confirm({
      content: I18n.t('competitions.competition_form.submit_confirm'),
    }).then(() => {
      save(confirmCompetitionUrl(competitionId), null, () => {
        sync();

        // mark the competition as announced and commit immediately.
        // (we do not want the announce button to trigger the "there are unsaved changes" alert)
        dispatch(updateFormValue('isConfirmed', true, ['admin']));
        dispatch(changesSaved());
      }, {
        body: null,
        method: 'PUT',
      });
    });
  };

  if (!canConfirm) return null;

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
  competitionId,
  data,
}) {
  const { cannotDeleteReason } = data;

  const { save } = useSaveAction();
  const confirm = useConfirm();

  const deleteCompetition = () => {
    confirm({
      content: I18n.t('competitions.competition_form.submit_delete'),
    }).then(() => {
      save(competitionUrl(competitionId), null, () => {
        window.location.replace(homepageUrl);
      }, {
        body: null,
        method: 'DELETE',
      });
    });
  };

  if (cannotDeleteReason) return null;

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
  const {
    isAdminView,
    isPersisted,
    initialCompetition: {
      competitionId,
      admin: { isConfirmed },
    },
  } = useStore();

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
        {isPersisted && !isAdminView && !isConfirmed && (
          <ConfirmButton competitionId={competitionId} data={data} sync={sync} />
        )}
        {isPersisted && !isConfirmed && (
          <DeleteButton competitionId={competitionId} data={data} />
        )}
      </Button.Group>
    </ConfirmProvider>
  );
}
