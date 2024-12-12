import React from 'react';
import { DateTime } from 'luxon';
import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import Markdown from '../Markdown';
import { isoMoneyToHumanReadable } from '../../lib/helpers/money';
import { getFullDateTimeString } from '../../lib/utils/dates';

export default function RegistrationRequirements({ competition, userInfo, showLinksToRegisterPage = false }) {
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
                base_entry_fee: isoMoneyToHumanReadable(competition.base_entry_fee_lowest_denomination, competition.currency_code),
              })
              : I18n.t('competitions.competition_info.no_entry_fee')}
          </p>
          {competition.competition_events.map((event) => (event['has_fee?'] ? (
            <dl key={event.id}>
              <dt>{event.event.name}</dt>
              <dd>{isoMoneyToHumanReadable(event.fee)}</dd>
            </dl>
          ) : null))}
        </div>
      )}

      {competition['using_payment_integrations?'] && (
        <I18nHTMLTranslate
          i18nKey={showLinksToRegisterPage
            ? 'competitions.competition_info.use_stripe_link_html'
            : 'competitions.competition_info.use_stripe_below_html'}
          options={{
            here: `<a href='/competitions/${competition.id}/register'>${I18n.t(
              'common.here',
            )}</a>`,
          }}
        />
      )}
      <br />
      {competition.refund_policy_percent || !competition['has_fees?']
        ? I18n.t('competitions.competition_info.refund_policy_html', {
          refund_policy_percent: `${competition.refund_policy_percent}%`,
          limit_date_and_time:
            getFullDateTimeString(DateTime.fromISO(competition.refund_policy_limit_date)),
        })
        : I18n.t('competitions.competition_info.no_refunds')}
      <br />
      {competition.waiting_list_deadline_date
        && (
          <>
            {I18n.t(
              'competitions.competition_info.waiting_list_deadline_html',
              {
                waiting_list_deadline:
                  getFullDateTimeString(DateTime.fromISO(competition.waiting_list_deadline_date)),
              },
            )}
            <br />
          </>
        )}
      {competition.competition_events.length > 1 && competition.has_event_change_deadline_date && (
        competition.event_change_deadline_date ? (
          competition['allow_registration_edits?'] ? I18n.t('competitions.competition_info.event_change_deadline_edits_allowed_html', {
            event_change_deadline:
                  getFullDateTimeString(DateTime.fromISO(competition.event_change_deadline_date)),
            register: `<a href='/competitions/${competition.id}/register'>${I18n.t('competitions.nav.menu.register')}</a>`,
          })
            : I18n.t('competitions.competition_info.event_change_deadline_html', {
              event_change_deadline:
                  getFullDateTimeString(DateTime.fromISO(competition.event_change_deadline_date)),
            })
        )
          : I18n.t('competitions.competition_info.event_change_deadline_default_html')

      )}
      <br />

      {competition['on_the_spot_registration?'] ? (
        competition.on_the_spot_entry_fee_lowest_denomination ? (
          I18n.t('competitions.competition_info.on_the_spot_registration_fee_html', {
            on_the_spot_base_entry_fee:
                  isoMoneyToHumanReadable(
                    competition.on_the_spot_base_entry_fee,
                    competition.currency_code,
                  ),
          })
        )
          : I18n.t('competitions.competition_info.on_the_spot_registration_free')

      )
        : I18n.t('competitions.competition_info.no_on_the_spot_registration')}
      <br />
      {competition.guests_entry_fee_lowest_denomination ? (
        <>
          {I18n.t('competitions.competition_info.guests_pay', {
            guests_base_fee:
              isoMoneyToHumanReadable(
                competition.guests_entry_fee_lowest_denomination,
                competition.currency_code,
              ),
          })}
          <br />
        </>
      ) : (
        <>
          {competition['all_guests_allowed?'] ? (
            I18n.t('competitions.competition_info.guests_free.free')
          ) : competition['some_guests_allowed?'] ? (
            I18n.t('competitions.competition_info.guests_free.restricted')
          ) : null}
          <br />
        </>
      )}

      {competition['guests_per_registration_limit_enabled?'] && (
        <>
          {I18n.t('competitions.competition_info.guest_limit', { count: competition.guests_per_registration_limit })}
          <br />
        </>
      )}

      {competition['uses_qualification?'] && !competition.allow_registration_without_qualification && (
        <>
          {I18n.t('competitions.competition_info.require_qualification')}
          <br />
        </>
      )}

      {competition['events_per_registration_limit_enabled?'] && (
        <>
          {I18n.t('competitions.competition_info.event_limit', { count: competition.events_per_registration_limit })}
          )
          <br />
        </>
      )}
      <br />
      {competition.extra_registration_requirements && (
        <Markdown md={competition.extra_registration_requirements} id="competition-info-extra-requirements" />
      )}
    </div>
  );
}
