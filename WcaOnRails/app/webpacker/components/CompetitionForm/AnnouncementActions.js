import {
  Button,
  Container,
  Header,
  List,
} from 'semantic-ui-react';
import React, { useMemo } from 'react';
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

function AnnounceAction({
  data,
  sync,
}) {
  const {
    isAnnounced,
    announcedBy,
    announcedAt,
  } = data;

  const { competition: { competitionId } } = useStore();

  const { save } = useSaveAction();
  const confirm = useConfirm();

  const postAnnouncement = () => {
    confirm({
      content: 'Do you really want to announce?',
    }).then(() => {
      save(announceCompetitionUrl(competitionId), null, sync, {
        body: null,
        method: 'PUT',
      });
    });
  };

  if (isAnnounced) {
    return (
      <List.Item>
        {I18n.t('competitions.announced_by_html', { announcer_name: announcedBy, date_time: announcedAt })}
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
  data,
  sync,
}) {
  const {
    isCancelled,
    cancelledBy,
    cancelledAt,
    canBeCancelled,
  } = data;

  const { competition: { competitionId } } = useStore();

  const { save } = useSaveAction();
  const confirm = useConfirm();

  const cancelCompetition = (undo) => {
    confirm({
      content: 'Do you really want to (un)cancel?',
    }).then(() => {
      save(cancelCompetitionUrl(competitionId, undo), null, sync, {
        body: null,
        method: 'PUT',
      });
    });
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
  data,
  sync,
}) {
  const {
    isRegistrationPast,
    isRegistrationFull,
    canCloseFullRegistration,
  } = data;

  const { competition: { competitionId } } = useStore();

  const { save } = useSaveAction();
  const confirm = useConfirm();

  const closeRegistrationWhenFull = () => {
    confirm({
      content: 'Do you really want to close the registration?',
    }).then(() => {
      save(closeRegistrationWhenFullUrl(competitionId), null, sync, {
        body: null,
        method: 'PUT',
      });
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
  const { isAdminView, competition: { competitionId } } = useStore();

  const dataUrl = useMemo(() => competitionAnnouncementDataUrl(competitionId), [competitionId]);

  const {
    data,
    loading,
    sync,
  } = useLoadedData(dataUrl);

  if (loading) return <Loading />;

  return (
    <ConfirmProvider>
      <Container fluid>
        <Header>{I18n.t('competitions.announcements')}</Header>
        <List bulleted>
          {isAdminView && <AnnounceAction data={data} sync={sync} />}
          {isAdminView && <CancelAction data={data} sync={sync} />}
          <CloseRegistrationAction data={data} sync={sync} />
        </List>
      </Container>
    </ConfirmProvider>
  );
}
