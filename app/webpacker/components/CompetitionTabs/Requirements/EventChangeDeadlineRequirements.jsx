import React from 'react';
import { DateTime } from 'luxon';
import I18n from '../../../lib/i18n';
import { getFullDateTimeString } from '../../../lib/utils/dates';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

export default function EventChangeDeadlineRequirements({ competition }) {
  if (competition.event_change_deadline_date) {
    if (competition['allow_registration_edits?']) {
      /* i18n-tasks-use t('competitions.competition_info.event_change_deadline_edits_allowed_html') */
      return (
        <I18nHTMLTranslate
          i18nKey="competitions.competition_info.event_change_deadline_edits_allowed_html"
          options={{
            event_change_deadline:
          getFullDateTimeString(DateTime.fromISO(competition.event_change_deadline_date)),
            register: `<a href='/competitions/${competition.id}/register'>${I18n.t('competitions.nav.menu.register')}</a>`,
          }}
        />
      );
    }
    return I18n.t('competitions.competition_info.event_change_deadline_html', {
      event_change_deadline:
          getFullDateTimeString(DateTime.fromISO(competition.event_change_deadline_date)),
    });
  }
  return I18n.t('competitions.competition_info.event_change_deadline_default_html');
}
