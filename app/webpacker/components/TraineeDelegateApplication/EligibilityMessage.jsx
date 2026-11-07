import React from 'react';
import { List, Message } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import { claimWcaIdUrl, profileEditUrl } from '../../lib/requests/routes.js.erb';

// i18n-tasks-use t('trainee_delegate_application.eligibility.missing_wca_id')
// i18n-tasks-use t('trainee_delegate_application.eligibility.missing_date_of_birth')
// i18n-tasks-use t('trainee_delegate_application.eligibility.underage')

// Issues that the applicant can resolve themselves link to the page where they do so.
const LINKS_BY_ISSUE = {
  missing_wca_id: {
    url: claimWcaIdUrl,
    i18nKey: 'trainee_delegate_application.eligibility.claim_wca_id',
  },
  missing_date_of_birth: {
    url: profileEditUrl,
    i18nKey: 'trainee_delegate_application.eligibility.edit_profile',
  },
};

export default function EligibilityMessage({ issues, minimumAge }) {
  return (
    <Message negative>
      <Message.Header>{I18n.t('trainee_delegate_application.eligibility.title')}</Message.Header>
      <List bulleted>
        {issues.map((issue) => {
          const link = LINKS_BY_ISSUE[issue];

          return (
            <List.Item key={issue}>
              {I18n.t(`trainee_delegate_application.eligibility.${issue}`, { minimum_age: minimumAge })}
              {link && (
                <>
                  {' '}
                  <a href={link.url}>{I18n.t(link.i18nKey)}</a>
                </>
              )}
            </List.Item>
          );
        })}
      </List>
    </Message>
  );
}
