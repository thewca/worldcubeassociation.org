import {
  Button,
  Dimmer,
  Header,
  List,
  Segment,
} from 'semantic-ui-react';
import React, { useCallback } from 'react';
import { DateTime } from 'luxon';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import { useStore } from '../../lib/providers/StoreProvider';
import {
  announceCompetitionUrl,
  cancelCompetitionUrl,
  closeRegistrationWhenFullUrl,
} from '../../lib/requests/routes.js.erb';
import ConfirmProvider, { useConfirm } from '../../lib/providers/ConfirmProvider';
import {
  useFormContext,
  useFormErrorHandler,
} from '../wca/FormBuilder/provider/FormObjectProvider';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { announcementDataQueryKey, confirmationDataQueryKey, useAnnouncementData } from './api';
import Loading from '../Requests/Loading';

function AnnounceAction({
  competitionId,
  announcementData,
}) {
  const {
    isAnnounced,
    announcedBy,
    announcedAt,
  } = announcementData;

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (compId) => fetchJsonOrError(announceCompetitionUrl(compId), {
      method: 'PUT',
    }),
    onSuccess: (respData, compId) => queryClient.setQueryData(
      announcementDataQueryKey(compId),
      respData,
    ),
  });

  const confirm = useConfirm();

  const postAnnouncement = useCallback(() => confirm({
    content: I18n.t('competitions.announce_confirm'),
  }).then(() => mutation.mutate(competitionId)), [competitionId, confirm, mutation]);

  if (isAnnounced) {
    const announcedAtLuxon = DateTime.fromISO(announcedAt);

    return (
      <List.Item>
        {I18n.t('competitions.announced_by_html', {
          announcer_name: announcedBy,
          date_time: announcedAtLuxon.toLocaleString(DateTime.DATETIME_FULL),
        })}
      </List.Item>
    );
  }

  return (
    <List.Item>
      <Button positive onClick={postAnnouncement}>{I18n.t('competitions.post_announcement')}</Button>
    </List.Item>
  );
}

function CancelAction({
  competitionId,
  data,
}) {
  const {
    isCancelled,
    cancelledBy,
    cancelledAt,
    canBeCancelled,
  } = data;

  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ compId, undo }) => fetchJsonOrError(cancelCompetitionUrl(compId, undo), {
      method: 'PUT',
    }),
    onSuccess: (respData, variables) => queryClient.setQueryData(
      confirmationDataQueryKey(variables.compId),
      respData,
    ),
  });

  const submitCancelToBackend = useCallback(
    (undo) => mutation.mutate({ compId: competitionId, undo }),
    [competitionId, mutation],
  );

  const cancelCompetition = useCallback((undo) => {
    if (undo) {
      // No confirmation message for undoing the cancel
      submitCancelToBackend(undo);
    } else {
      confirm({
        content: I18n.t('competitions.cancel_confirm'),
      }).then(() => submitCancelToBackend(undo));
    }
  }, [confirm, submitCancelToBackend]);

  if (isCancelled) {
    return (
      <List.Item>
        {I18n.t('competitions.cancelled_by_html', { name: cancelledBy, date_time: cancelledAt })}
        <List.List verticalAlign="middle">
          <List.Item>
            {I18n.t('competitions.cancel_mistake')}
            <Button
              secondary
              disabled={mutation.isPending}
              onClick={() => cancelCompetition(true)}
            >
              {I18n.t('competitions.uncancel')}
            </Button>
          </List.Item>
        </List.List>
      </List.Item>
    );
  }

  if (canBeCancelled) {
    return (
      <List.Item>
        <Button
          negative
          disabled={mutation.isPending}
          onClick={() => cancelCompetition(false)}
        >
          {I18n.t('competitions.cancel')}
        </Button>
      </List.Item>
    );
  }

  return (
    <List.Item>
      {I18n.t('competitions.note_before_cancel')}
    </List.Item>
  );
}

function CloseRegistrationAction({
  competitionId,
  data,
}) {
  const {
    isRegistrationPast,
    isRegistrationFull,
    canCloseFullRegistration,
  } = data;

  const onError = useFormErrorHandler();

  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (compId) => fetchJsonOrError(closeRegistrationWhenFullUrl(compId), {
      method: 'PUT',
    }),
    onSuccess: (respData, compId) => queryClient.setQueryData(
      announcementDataQueryKey(compId),
      respData,
    ),
    onError,
  });

  const closeRegistrationWhenFull = useCallback(() => confirm({
    content: I18n.t('competitions.orga_close_reg_confirm'),
  }).then(() => {
    mutation.mutate(competitionId);
  }), [competitionId, confirm, mutation]);

  if (isRegistrationPast) {
    return (
      <List.Item>
        {I18n.t('competitions.note_reg_closed_orga_close_reg')}
      </List.Item>
    );
  }

  if (!isRegistrationFull) {
    return (
      <List.Item>
        {I18n.t('competitions.note_reg_not_full_orga_close_reg')}
      </List.Item>
    );
  }

  if (!canCloseFullRegistration) return null;

  return (
    <List.Item>
      <Button
        negative
        onClick={closeRegistrationWhenFull}
        disabled={mutation.isPending}
      >
        {I18n.t('competitions.orga_close_reg')}
      </Button>
    </List.Item>
  );
}

export default function AnnouncementActions({ competitionId }) {
  const { isAdminView } = useStore();

  const {
    data: announcementData,
    isLoading,
  } = useAnnouncementData(competitionId);

  const { unsavedChanges } = useFormContext();

  if (isLoading) return <Loading />;

  return (
    <ConfirmProvider>
      <Dimmer.Dimmable as={Segment} blurring dimmed={unsavedChanges}>
        <Dimmer active={unsavedChanges}>
          You have unsaved changes. Please save the competition before taking any other action.
        </Dimmer>

        <Header style={{ marginTop: 0 }}>{I18n.t('competitions.announcements')}</Header>
        <List bulleted verticalAlign="middle">
          {isAdminView && <AnnounceAction competitionId={competitionId} data={announcementData} />}
          {isAdminView && <CancelAction competitionId={competitionId} data={announcementData} />}
          <CloseRegistrationAction competitionId={competitionId} data={announcementData} />
        </List>
      </Dimmer.Dimmable>
    </ConfirmProvider>
  );
}
