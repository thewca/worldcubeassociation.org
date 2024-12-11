import React from 'react';
import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import Markdown from '../Markdown';

export default function RegistrationRequirements({ competition, userInfo, showLinksToRegisterPage = false }) {
  const formatMoney = (amount) => `$${(amount / 100).toFixed(2)}`; // Example formatting, adjust as needed
  const wcaLocalTime = (time) => new Date(time).toLocaleString(); // Example formatting, adjust as needed

  return (
    <div>
      {competition.use_wca_registration && (
        <div>
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
          {showLinksToRegisterPage ? (
            <I18nHTMLTranslate
              i18nKey="competitions.competition_info.register_link_html"
              options={{
                here: `<a href='/competitions/${competition.id}/register'>${I18n.t('common.here')}</a>`,
              }}
            />
          ) : (
            <p>{I18n.t('competitions.competition_info.register_below_html')}</p>
          )}
        </div>
      )}

      {competition.external_registration_page && (
        <p
          dangerouslySetInnerHTML={{
            __html: I18n.t('competitions.competition_info.register_link_html', {
              here: `<a href='${competition.external_registration_page}' target='_blank'>${I18n.t('common.here')}</a>`,
            }),
          }}
        />
      )}

      {competition['part_of_competition_series?'] && (
        <div>
          <p>
            {I18n.t('competitions.competition_info.part_of_a_series_list', {
              name: competition.competition_series.name,
            })}
          </p>
          <ul>
            {competition.series_sibling_competitions.map((comp) => (
              <li key={comp.id}>
                <a href={`/competitions/${comp.id}`}>{comp.name}</a>
              </li>
            ))}
          </ul>
          <p>{I18n.t('competitions.competition_info.series_registration_warning_html')}</p>
        </div>
      )}

      {competition.competitor_limit_enabled && (
        <p>
          {I18n.t(
            competition.competitor_limit_enabled
              ? 'competitions.competition_info.competitor_limit_is'
              : 'competitions.competition_info.no_competitor_limit',
            { competitor_limit: competition.competitor_limit },
          )}
        </p>
      )}

      {competition['has_fees?'] && (
        <div>
          <p>
            {competition.base_entry_fee_lowest_denomination
              ? I18n.t('competitions.competition_info.entry_fee_is', {
                base_entry_fee: formatMoney(competition.base_entry_fee),
              })
              : I18n.t('competitions.competition_info.no_entry_fee')}
          </p>
          {competition.competition_events.map((event) => (event['has_fee?'] ? (
            <dl key={event.id}>
              <dt>{event.event.name}</dt>
              <dd>{formatMoney(event.fee)}</dd>
            </dl>
          ) : null))}
        </div>
      )}

      {competition['using_payment_integrations?'] && (
        <p
          dangerouslySetInnerHTML={{
            __html: I18n.t(
              showLinksToRegisterPage
                ? 'competitions.competition_info.use_stripe_link_html'
                : 'competitions.competition_info.use_stripe_below_html',
              {
                here: `<a href='/competitions/${competition.id}/register'>${t(
                  'common.here',
                )}</a>`,
              },
            ),
          }}
        />
      )}

      {competition.extra_registration_requirements && (
        <Markdown md={competition.extra_registration_requirements} id="competition-info-extra-requirements" />
      )}
    </div>
  );
}
