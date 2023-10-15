import {
  Button,
  Container,
  Header,
  List,
} from 'semantic-ui-react';
import React from 'react';
import I18n from '../../lib/i18n';
import { useStore } from '../../lib/providers/StoreProvider';

function AnnounceAction() {
  const {
    status: {
      isAnnounced,
      announcedBy,
      announcedAt,
    },
  } = useStore();

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

function CancelAction() {
  const {
    status: {
      isCancelled,
      cancelledBy,
      cancelledAt,
      canBeCancelled,
    },
  } = useStore();

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

function CloseRegistrationAction() {
  const {
    status: {
      isRegistrationPast,
      isRegistrationFull,
      canCloseFullRegistration,
    },
  } = useStore();

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
  const { isAdminView } = useStore();

  return (
    <Container fluid>
      <Header>{I18n.t('competitions.announcements')}</Header>
      <List bulleted>
        {isAdminView && <AnnounceAction />}
        {isAdminView && <CancelAction />}
        <CloseRegistrationAction />
      </List>
    </Container>
  );
}
