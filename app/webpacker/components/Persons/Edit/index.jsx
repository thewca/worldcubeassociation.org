import React, { useMemo } from 'react';
import {
  Container, Form, Header, Message, Tab,
} from 'semantic-ui-react';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import I18n from '../../../lib/i18n';
import EditAvatar from '../../EditAvatar';
import RolesTab from '../../RolesTab';
import GeneralChangesTab from './GeneralChangesTab';
import EmailChangeTab from './EmailChangeTab';
import PasswordChangeTab from './PasswordChangeTab';
import PreferencesTab from './PreferencesTab';
import TwoFactorChangeTab from './TwoFactorChangeTab';

export default function Wrapper({
  user, currentUser, editableFields, recentlyAuthenticated,
}) {
  return (
    <WCAQueryClientProvider>
      <EditUser
        user={user}
        currentUser={currentUser}
        editableFields={editableFields}
        recentlyAuthenticated={recentlyAuthenticated}
      />
    </WCAQueryClientProvider>
  );
}

function getFormWarnings(user, currentUser) {
  const warnings = [];

  if (!user.confirmed_at) {
    warnings.push({ content: I18n.t('users.edit.unconfirmed_email', { email: user.email }) });
  }

  if (user.unconfirmed_wca_id) {
    warnings.push({ content: I18n.t('users.edit.unconfirmed_email', { email: user.email }) });
  }

  if (user.unconfirmed_email) {
    warnings.push({ content: I18n.t('users.edit.pending_mail_confirmation', { email: user.unconfirmed_email }) });
  }

  if (user['dummy_account?']) {
    warnings.push({
      content: `This account is a dummy account. It serves as a placeholder because the competitor
      uploaded a profile picture before the website supported WCA accounts. This
      account will be automatically deleted when another user is assigned WCA
      id ${user.wca_id}.
      See "https://github.com/thewca/worldcubeassociation.org/commit/32624f95b2c9e68967f8680ffa3ed7aefccd5319 for more details.`,
    });
  }

  if (user.cannot_register_for_competition_reasons.length > 0) {
    warnings.push({ content: I18n.t('users.edit.please_fix_profile'), list: user.cannot_register_for_competition_reasons });
  }

  if (currentUser.cannot_edit_data_reason_html) {
    warnings.push({ content: currentUser.cannot_edit_data_reason_html });
  }

  return warnings;
}

const getSlugFromPath = () => {
  if (window.location.hash) {
    return window.location.hash.substring(1);
  }
  return null;
};

const tabIndexFromSlug = (panes) => {
  const pathSlug = getSlugFromPath();
  if (!pathSlug) {
    return 0;
  }
  return panes.findIndex((p) => p.slug === pathSlug);
};

const updatePath = (tabSlug) => {
  window.history.replaceState({}, '', `${window.location.pathname}#${tabSlug}`);
};

function EditUser({
  user, currentUser, editableFields, recentlyAuthenticated,
}) {
  const warnings = useMemo(() => getFormWarnings(user, currentUser), [user, currentUser]);
  const panes = useMemo(() => {
    const p = [{
      slug: 'general',
      menuItem: I18n.t('users.edit.general'),
      render: () => (
        <GeneralChangesTab
          user={user}
          editableFields={editableFields}
        />
      ),
    }];
    if (user.id === currentUser.id) {
      p.push(
        {
          slug: 'email',
          menuItem: I18n.t('users.edit.email'),
          render: () => (
            <EmailChangeTab
              user={user}
              editableFields={editableFields}
              recentlyAuthenticated={recentlyAuthenticated}
            />
          ),
        },
        {
          slug: 'preferences',
          menuItem: I18n.t('users.edit.preferences'),
          render: () => (
            <PreferencesTab
              user={user}
            />
          ),
        },
        {
          slug: 'password',
          menuItem: I18n.t('users.edit.password'),
          render: () => (
            <PasswordChangeTab
              user={user}
              recentlyAuthenticated={recentlyAuthenticated}
            />
          ),
        },
        {
          slug: '2fa',
          menuItem: '2FA',
          render: () => (
            <TwoFactorChangeTab
              user={user}
              recentlyAuthenticated={recentlyAuthenticated}
            />
          ),
        },
      );
    }
    if (currentUser['can_change_users_avatar?']) {
      p.push({
        slug: 'avatar',
        menuItem: 'Avatar',
        render: () => (
          <EditAvatar
            userId={user.id}
            showStaffGuidelines={user['staff_or_any_delegate?']}
            uploadDisabled={!editableFields.includes('pending_avatar')}
            canAdminAvatars={editableFields.includes('remove_avatar')}
            canRemoveAvatar={currentUser['can_admin_results?']}
          />
        ),
      });
    }
    if (currentUser['can_view_all_users?']) {
      p.push({
        slug: 'roles',
        menuItem: 'Roles',
        render: () => (
          <RolesTab
            userId={user.id}
          />
        ),
      });
    }
    return p;
  }, [user, currentUser, editableFields, recentlyAuthenticated]);

  return (
    <Container>
      <Header as="h1" textAlign="center">
        {user.name}
        {' '}
        (
        <a href={`mailto:${user.email}`}>{user.email}</a>
        )
      </Header>
      {warnings.map((warning) => (
        <Message warning list={warning.list}>
          <span dangerouslySetInnerHTML={{ __html: warning.content }} />
        </Message>
      ))}
      <Tab
        defaultActiveIndex={tabIndexFromSlug(panes)}
        panes={panes}
        menu={{ color: 'orange', widths: panes.length }}
        onTabChange={(e, { activeIndex }) => {
          const tab = panes[activeIndex];
          updatePath(tab.slug);
        }}
      />
    </Container>
  );
}
