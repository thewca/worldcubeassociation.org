import React from 'react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import I18n from '../../../lib/i18n';

export default function AccountRequirement({ userInfo }) {
  return (
    <>
      {!userInfo && (
        <>
          <I18nHTMLTranslate
            i18nKey="competitions.competition_info.create_wca_account_html"
            options={{
              here: `<a href='/users/sign_up'>${I18n.t('common.here')}</a>`,
            }}
          />
          {' '}
          <I18nHTMLTranslate
            i18nKey="competitions.competition_info.claim_wca_id_html"
            options={{
              here: `<a href='/profile/claim_wca_id'>${I18n.t('common.here')}</a>`,
            }}
          />
        </>
      )}
      {userInfo && !userInfo.wca_id && !userInfo.unconfirmed_wca_id && (
        <I18nHTMLTranslate
          i18nKey="competitions.competition_info.claim_wca_id_html"
          options={{
            here: `<a href='/profile/claim_wca_id'>${I18n.t('common.here')}</a>`,
          }}
        />
      )}
    </>
  );
}
