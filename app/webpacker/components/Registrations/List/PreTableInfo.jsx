import React from 'react';
import {
  Button, Message,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';

export default function PreTableInfo({
  scrollToMeIsShown,
  onScrollToMeClick = {},
  userRankIsShown,
  userRank = '-',
  registrationCount,
  newcomerCount,
  returnerCount,
}) {
  return (
    <Message>
      {scrollToMeIsShown && (
        <Button
          size="mini"
          onClick={onScrollToMeClick}
        >
          {I18n.t('competitions.registration_v2.list.psychsheets.show_me')}
        </Button>
      )}
      {' '}
      {userRankIsShown && (
        `${
          I18n.t(
            'competitions.registration_v2.list.psychsheets.rank',
            { userPosition: userRank },
          )
        }; `
      )}
      {
        `${
          newcomerCount
        } ${
          I18n.t('registrations.registration_info_people.newcomer', { count: newcomerCount })
        } + ${
          returnerCount
        } ${
          I18n.t('registrations.registration_info_people.returner', { count: returnerCount })
        } = ${
          registrationCount
        } ${
          I18n.t('registrations.registration_info_people.person', { count: registrationCount })
        }`
      }
    </Message>
  );
}
