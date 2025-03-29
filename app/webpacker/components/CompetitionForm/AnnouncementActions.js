import {
  Header,
  List,
} from 'semantic-ui-react';
import React from 'react';
import { DateTime } from 'luxon';
import { useMutation } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import { useStore } from '../../lib/providers/StoreProvider';
import {
  announceCompetitionUrl,
  cancelCompetitionUrl,
  closeRegistrationWhenFullUrl,
} from '../../lib/requests/routes.js.erb';
import ConfirmProvider from '../../lib/providers/ConfirmProvider';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import {
  announcementDataQueryKey,
  confirmationDataQueryKey,
  useAnnouncementData,
  useQueryDataSetter,
} from './api';
import Loading from '../Requests/Loading';
import { FormActionButton } from '../wca/FormBuilder/EditForm';

function AnnounceAction({
  competitionId,
  announcementData,
}) {
  const {
    isAnnounced,
    announcedBy,
    announcedAt,
  } = announcementData;

  const setAnnouncementData = useQueryDataSetter(announcementDataQueryKey(competitionId));

  const mutation = useMutation({
    mutationFn: () => fetchJsonOrError(announceCompetitionUrl(competitionId), {
      method: 'PUT',
    }).then((raw) => raw.data),
    onSuccess: setAnnouncementData,
  });

  if (isAnnounced) {
    const announcedAtLuxon = DateTime.fromISO(announcedAt);

    return I18n.t('competitions.announced_by_html', {
      announcer_name: announcedBy,
      date_time: announcedAtLuxon.toLocaleString(DateTime.DATETIME_FULL),
    });
  }

  return (
    <FormActionButton
      mutation={mutation}
      confirmationMessage={I18n.t('competitions.announce_confirm')}
      buttonText={I18n.t('competitions.post_announcement')}
      buttonProps={{ positive: true }}
    />
  );
}

function CancelAction({
  competitionId,
  announcementData,
}) {
  const {
    isCancelled,
    cancelledBy,
    cancelledAt,
    canBeCancelled,
  } = announcementData;

  const setConfirmationData = useQueryDataSetter(confirmationDataQueryKey(competitionId));

  const cancelMutation = useMutation({
    mutationFn: () => fetchJsonOrError(cancelCompetitionUrl(competitionId), {
      method: 'PUT',
    }).then((raw) => raw.data),
    onSuccess: setConfirmationData,
  });

  const uncancelMutation = useMutation({
    mutationFn: () => fetchJsonOrError(cancelCompetitionUrl(competitionId, true), {
      method: 'PUT',
    }).then((raw) => raw.data),
    onSuccess: setConfirmationData,
  });

  if (isCancelled) {
    return (
      <>
        {I18n.t('competitions.cancelled_by_html', { name: cancelledBy, date_time: cancelledAt })}
        <List.List verticalAlign="middle">
          <List.Item>
            {I18n.t('competitions.cancel_mistake')}
          </List.Item>
          <List.Item>
            <FormActionButton
              mutation={uncancelMutation}
              buttonText={I18n.t('competitions.uncancel')}
              buttonProps={{ secondary: true }}
            />
          </List.Item>
        </List.List>
      </>
    );
  }

  if (canBeCancelled) {
    return (
      <FormActionButton
        mutation={cancelMutation}
        confirmationMessage={I18n.t('competitions.cancel_confirm')}
        buttonText={I18n.t('competitions.cancel')}
        buttonProps={{ negative: true }}
      />
    );
  }

  return I18n.t('competitions.note_before_cancel');
}

function CloseRegistrationAction({
  competitionId,
  announcementData,
}) {
  const {
    isRegistrationPast,
    isRegistrationFull,
    canCloseFullRegistration,
  } = announcementData;

  const setAnnouncementData = useQueryDataSetter(announcementDataQueryKey(competitionId));

  const mutation = useMutation({
    mutationFn: () => fetchJsonOrError(closeRegistrationWhenFullUrl(competitionId), {
      method: 'PUT',
    }).then((raw) => raw.data),
    onSuccess: setAnnouncementData,
  });

  if (isRegistrationPast) return I18n.t('competitions.note_reg_closed_orga_close_reg');
  if (!isRegistrationFull) return I18n.t('competitions.note_reg_not_full_orga_close_reg');

  if (!canCloseFullRegistration) return null;

  return (
    <FormActionButton
      mutation={mutation}
      confirmationMessage={I18n.t('competitions.orga_close_reg_confirm')}
      buttonText={I18n.t('competitions.orga_close_reg')}
      buttonProps={{ negative: true }}
    />
  );
}

export default function AnnouncementActions({ competitionId }) {
  const { isAdminView } = useStore();

  const {
    data: announcementData,
    isLoading,
  } = useAnnouncementData(competitionId);

  if (isLoading) return <Loading />;

  return (
    <ConfirmProvider>
      <Header style={{ marginTop: 0 }}>{I18n.t('competitions.announcements')}</Header>
      <List bulleted verticalAlign="middle">
        {isAdminView && (
          <List.Item>
            <AnnounceAction
              competitionId={competitionId}
              announcementData={announcementData}
            />
          </List.Item>
        )}
        {isAdminView && (
          <List.Item>
            <CancelAction
              competitionId={competitionId}
              announcementData={announcementData}
            />
          </List.Item>
        )}
        <List.Item>
          <CloseRegistrationAction
            competitionId={competitionId}
            announcementData={announcementData}
          />
        </List.Item>
      </List>
    </ConfirmProvider>
  );
}
