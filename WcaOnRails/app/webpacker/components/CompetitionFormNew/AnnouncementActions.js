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
import { competitionAnnouncementDataUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';

function AnnounceAction({
  data,
}) {
  const {
    isAnnounced,
    announcedBy,
    announcedAt,
  } = data;

  if (isAnnounced) {
    return (
      <List.Item>
        {I18n.t('competitions.announced_by_html', { announcer_name: announcedBy, date_time: announcedAt })}
      </List.Item>
    );
  }

  return (
    <List.Item>
      <Button positive>{I18n.t('competitions.post_announcement')}</Button>
    </List.Item>
  );
}

function CancelAction({
  data,
}) {
  const {
    isCancelled,
    cancelledBy,
    cancelledAt,
    canBeCancelled,
  } = data;

  if (isCancelled) {
    return (
      <List.Item>
        {I18n.t('competitions.cancelled_by_html', { name: cancelledBy, date_time: cancelledAt })}
        <List.List>
          <List.Item>
            {I18n.t('competitions.cancel_mistake')}
            <Button>
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
        {/* TODO: confirmation dialog */}
        <Button negative>{I18n.t('competitions.cancel')}</Button>
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
}) {
  const {
    isRegistrationPast,
    isRegistrationFull,
    canCloseFullRegistration,
  } = data;

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
      {/* TODO: confirmation dialog */}
      <Button negative>{I18n.t('competitions.orga_close_reg')}</Button>
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
    <Container fluid>
      <Header>{I18n.t('competitions.announcements')}</Header>
      <List bulleted>
        {isAdminView && <AnnounceAction data={data} />}
        {isAdminView && <CancelAction data={data} />}
        <CloseRegistrationAction data={data} />
      </List>
    </Container>
  );
}
