import React from 'react';
import { Message } from 'semantic-ui-react';
import { useStore } from '../../lib/providers/StoreProvider';
import AnnouncementActions from './AnnouncementActions';
import UserPreferences from './UserPreferences';
import { useFormInitialObject } from '../wca/FormBuilder/provider/FormObjectProvider';
import I18nHTMLTranslate from '../I18nHTMLTranslate';

// FIXME: We should consider a better way of accessing the friendly ID instead of hard-coding.
const WCAT_FRIENDLY_ID = 'wcat';

function AnnouncementMessage() {
  const {
    isPersisted,
    isAdminView,
  } = useStore();

  const {
    admin: {
      isConfirmed,
      isVisible,
    },
  } = useFormInitialObject();

  if (!isPersisted) return null;

  let messageStyle = null;

  let i18nKey = null;
  let i18nReplacements = {};

  if (isConfirmed && isVisible) {
    if (isAdminView) return null;

    messageStyle = 'success';
    i18nKey = 'competitions.competition_form.public_and_locked_html';
  } else if (isConfirmed && !isVisible) {
    messageStyle = 'warning';
    i18nKey = 'competitions.competition_form.confirmed_but_not_visible_html';
    i18nReplacements = { contact: WCAT_FRIENDLY_ID.toLocaleUpperCase() };
  } else if (!isConfirmed && isVisible) {
    messageStyle = 'error';
    i18nKey = 'competitions.competition_form.is_visible';
  } else if (!isConfirmed && !isVisible) {
    messageStyle = 'warning';
    i18nKey = 'competitions.competition_form.pending_confirmation_html';
    i18nReplacements = { contact: WCAT_FRIENDLY_ID.toLocaleUpperCase() };
  }

  return (
    <Message error={messageStyle === 'error'} warning={messageStyle === 'warning'} success={messageStyle === 'success'}>
      <I18nHTMLTranslate
        i18nKey={i18nKey}
        options={i18nReplacements}
      />
    </Message>
  );
}

export default function CompFormHeader() {
  const { isPersisted } = useStore();

  return (
    <>
      {isPersisted && <AnnouncementActions />}
      {isPersisted && <UserPreferences />}
      <AnnouncementMessage />
    </>
  );
}
