import React, { useMemo } from 'react';
import _ from 'lodash';
import { useMutation } from '@tanstack/react-query';
import StoreProvider from '../../lib/providers/StoreProvider';
import { competitionUrl, confirmCompetitionUrl, homepageUrl } from '../../lib/requests/routes.js.erb';
import EditForm from '../wca/FormBuilder/EditForm';
import Header from './Header';
import MainForm from './MainForm';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import {
  confirmationDataQueryKey,
  useConfirmationData,
  useQueryDataSetter,
  useQueryRedirect,
} from './api';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import I18n from '../../lib/i18n';

function EditCompetition({
  competition,
  editingUserId,
  storedEvents,
  isAdminView,
  isSeriesPersisted,
  areResultsSubmitted,
}) {
  const originalCompId = competition.competitionId;
  const backendUrl = `${competitionUrl(originalCompId)}?adminView=${isAdminView}`;

  const redirectHandler = useQueryRedirect();

  const saveMutation = useMutation({
    // Deliberately do NOT use the "fresh" parameter `object` here, because
    //   when an admin changes the ID on the fly, the backend doesn't know about it yet.
    mutationFn: (object) => fetchJsonOrError(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(object),
    }).then((resp) => resp.data),
    onSuccess: redirectHandler,
  });

  const setConfirmationData = useQueryDataSetter(confirmationDataQueryKey(originalCompId));

  const confirmCompMutation = useMutation({
    mutationFn: () => fetchJsonOrError(confirmCompetitionUrl(originalCompId), {
      method: 'PUT',
    }).then((resp) => resp.data),
    onSuccess: setConfirmationData,
  });

  const deleteCompMutation = useMutation({
    mutationFn: () => fetchJsonOrError(competitionUrl(originalCompId), {
      method: 'DELETE',
    }),
    onSuccess: () => window.location.replace(homepageUrl),
  });

  const { data: confirmationData, isLoading } = useConfirmationData(competition.competitionId);

  const footerActions = [
    {
      id: 'confirm',
      mutation: confirmCompMutation,
      enabled: confirmationData?.canConfirm && !confirmationData?.isConfirmed && !isAdminView,
      confirmationMessage: I18n.t('competitions.competition_form.submit_confirm'),
      buttonText: I18n.t('competitions.competition_form.submit_confirm_value'),
      buttonProps: { positive: true },
    },
    {
      id: 'delete',
      mutation: deleteCompMutation,
      enabled: !confirmationData?.cannotDeleteReason && !confirmationData?.isConfirmed,
      confirmationMessage: I18n.t('competitions.competition_form.submit_delete', { competition_id: originalCompId }),
      confirmationOptions: {
        requireInput: originalCompId,
        confirmButton: 'Delete Competition',
      },
      buttonText: I18n.t('competitions.competition_form.submit_delete_value'),
      buttonProps: { negative: true },
    },
  ];

  const isDisabled = useMemo(() => {
    if (isLoading) return true;

    const { isConfirmed } = confirmationData;

    return isConfirmed && !isAdminView;
  }, [confirmationData, isAdminView, isLoading]);

  const allowIgnoreDisabled = useMemo(() => {
    const { staff: { staffDelegateIds, traineeDelegateIds } } = competition;
    const allDelegates = [...staffDelegateIds, ...traineeDelegateIds];

    const isDelegateEdit = allDelegates.includes(editingUserId);

    // Admins can edit whenever the heck they want.
    // Delegates should only be allowed to edit as long as results are not submitted,
    //   see https://github.com/thewca/worldcubeassociation.org/issues/11415 for details.
    return isAdminView || (isDelegateEdit && !areResultsSubmitted);
  }, [competition, editingUserId, isAdminView, areResultsSubmitted]);

  return (
    <StoreProvider
      reducer={_.identity}
      initialState={{
        isAdminView,
        isPersisted: true,
        isSeriesPersisted,
      }}
    >
      <EditForm
        initialObject={competition}
        saveMutation={saveMutation}
        CustomHeader={Header}
        footerActions={footerActions}
        saveButtonText={I18n.t('competitions.competition_form.submit_update_value')}
        globalDisabled={isDisabled}
        globalAllowIgnoreDisabled={allowIgnoreDisabled}
      >
        <MainForm storedEvents={storedEvents} />
      </EditForm>
    </StoreProvider>
  );
}

export default function Wrapper({
  competition,
  editingUserId,
  storedEvents = [],
  isAdminView = false,
  isSeriesPersisted = false,
  areResultsSubmitted = false,
}) {
  return (
    <WCAQueryClientProvider>
      <EditCompetition
        competition={competition}
        editingUserId={editingUserId}
        storedEvents={storedEvents}
        isAdminView={isAdminView}
        isSeriesPersisted={isSeriesPersisted}
        areResultsSubmitted={areResultsSubmitted}
      />
    </WCAQueryClientProvider>
  );
}
