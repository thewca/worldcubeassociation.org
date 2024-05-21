import {
  Button,
  Dimmer,
  Header,
  List,
  Segment,
} from 'semantic-ui-react';
import React, { useMemo } from 'react';
import { DateTime } from 'luxon';
import I18n from '../../lib/i18n';
import { useStore } from '../../lib/providers/StoreProvider';
import useLoadedData from '../../lib/hooks/useLoadedData';
import {
  announceCompetitionUrl,
  cancelCompetitionUrl,
  closeRegistrationWhenFullUrl,
  competitionAnnouncementDataUrl,
} from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import ConfirmProvider, { useConfirm } from '../../lib/providers/ConfirmProvider';
import useSaveAction from '../../lib/hooks/useSaveAction';
import {
  useFormContext,
  useFormErrorHandler,
  useFormInitialObject,
} from '../wca/FormBuilder/provider/FormObjectProvider';

function AnnounceAction({
  competitionId,
  data,
  sync,
}) {
  const {
    isAnnounced,
    announcedBy,
    announcedAt,
  } = data;

  const { save } = useSaveAction();
  const confirm = useConfirm();

  const postAnnouncement = () => {
    confirm({
      content: I18n.t('competitions.announce_confirm'),
    }).then(() => {
      save(announceCompetitionUrl(competitionId), null, sync, {
        body: null,
        method: 'PUT',
      });
    });
  };

  const announcedAtLuxon = DateTime.fromISO(announcedAt);

  if (isAnnounced) {
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
  sync,
}) {
  const {
    isCancelled,
    cancelledBy,
    cancelledAt,
    canBeCancelled,
  } = data;

  const { save } = useSaveAction();
  const confirm = useConfirm();

  const submitCancelToBackend = (undo) => {
    save(cancelCompetitionUrl(competitionId, undo), null, sync, {
      body: null,
      method: 'PUT',
    });
  };

  const cancelCompetition = (undo) => {
    if (undo) {
      // No confirmation message for undoing the cancel
      submitCancelToBackend(undo);
    } else {
      confirm({
        content: I18n.t('competitions.cancel_confirm'),
      }).then(() => {
        submitCancelToBackend(undo);
      });
    }
  };

  if (isCancelled) {
    return (
      <List.Item>
        {I18n.t('competitions.cancelled_by_html', { name: cancelledBy, date_time: cancelledAt })}
        <List.List>
          <List.Item>
            {I18n.t('competitions.cancel_mistake')}
            <Button secondary onClick={() => cancelCompetition(true)}>{I18n.t('competitions.uncancel')}</Button>
          </List.Item>
        </List.List>
      </List.Item>
    );
  }

  if (canBeCancelled) {
    return (
      <List.Item>
        <Button negative onClick={() => cancelCompetition(false)}>{I18n.t('competitions.cancel')}</Button>
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
  sync,
}) {
  const {
    isRegistrationPast,
    isRegistrationFull,
    canCloseFullRegistration,
  } = data;

  const onError = useFormErrorHandler();

  const { save } = useSaveAction();
  const confirm = useConfirm();

  const closeRegistrationWhenFull = () => {
    confirm({
      content: I18n.t('competitions.orga_close_reg_confirm'),
    }).then(() => {
      save(closeRegistrationWhenFullUrl(competitionId), null, sync, {
        body: null,
        method: 'PUT',
      }, onError);
    });
  };

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
      <Button negative onClick={closeRegistrationWhenFull}>{I18n.t('competitions.orga_close_reg')}</Button>
    </List.Item>
  );
}

export default function AnnouncementActions() {
  const { isAdminView } = useStore();

  const { competitionId } = useFormInitialObject();
  const { unsavedChanges: disabled } = useFormContext();

  const dataUrl = useMemo(() => competitionAnnouncementDataUrl(competitionId), [competitionId]);

  const {
    data,
    loading,
    sync,
  } = useLoadedData(dataUrl);

  if (loading) return <Loading />;

  return (
    <ConfirmProvider>
      <Dimmer.Dimmable as={Segment} blurring dimmed={disabled}>
        <Dimmer active={disabled}>
          You have unsaved changes. Please save the competition before taking any other action.
        </Dimmer>

        <Header style={{ marginTop: 0 }}>{I18n.t('competitions.announcements')}</Header>
        <List bulleted verticalAlign="middle">
          {isAdminView && <AnnounceAction competitionId={competitionId} data={data} sync={sync} />}
          {isAdminView && <CancelAction competitionId={competitionId} data={data} sync={sync} />}
          <CloseRegistrationAction
            competitionId={competitionId}
            data={data}
            sync={sync}
          />
        </List>
      </Dimmer.Dimmable>
    </ConfirmProvider>
  );
}
