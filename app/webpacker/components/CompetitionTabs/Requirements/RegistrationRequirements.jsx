import React from 'react';
import { DateTime } from 'luxon';
import { List } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import Markdown from '../../Markdown';
import { getFullDateTimeString } from '../../../lib/utils/dates';
import AccountRequirement from './AccountRequirement';
import CompetitionSeriesRequirement from './CompetitionSeriesRequirement';
import RegistrationFeeRequirements from './RegistrationFeeRequirements';
import EventChangeDeadlineRequirements from './EventChangeDeadlineRequirements';
import OnTheSpotRegistrationRequirements from './OnTheSpotRegistrationRequirements';
import GuestRequirements from './GuestRequirements';

export default function RegistrationRequirements({
  competition,
  userInfo, showLinksToRegisterPage = false,
}) {
  return (
    <List>
      {competition.use_wca_registration && (
        <List.Item>
          <AccountRequirement userInfo={userInfo} />
          {showLinksToRegisterPage ? (
            <I18nHTMLTranslate
              // i18n-tasks-use t('competitions.competition_info.register_link_html')
              i18nKey="competitions.competition_info.register_link_html"
              options={{
                here: `<a href='/competitions/${competition.id}/register'>${I18n.t('common.here')}</a>`,
              }}
            />
          ) : (
            <p>{I18n.t('competitions.competition_info.register_below_html')}</p>
          )}
        </List.Item>
      )}

      {competition.external_registration_page && (
        <List.Item>
          <I18nHTMLTranslate
            i18nKey="competitions.competition_info.register_link_html"
            options={{ here: `<a href='${competition.external_registration_page}' target='_blank'>${I18n.t('common.here')}</a>` }}
          />
        </List.Item>
      )}

      {competition['part_of_competition_series?'] && (
        <List.Item>
          <CompetitionSeriesRequirement competition={competition} />
        </List.Item>
      )}

      <List.Item>
        {/* i18n-tasks-use t('competitions.competition_info.competitor_limit_is') */}
        {/* i18n-tasks-use t('competitions.competition_info.no_competitor_limit') */}
        {I18n.t(
          competition.competitor_limit_enabled
            ? 'competitions.competition_info.competitor_limit_is'
            : 'competitions.competition_info.no_competitor_limit',
          { competitor_limit: competition.competitor_limit },
        )}
      </List.Item>

      <List.Item>
        {competition['has_fees?'] && <RegistrationFeeRequirements competition={competition} /> }
      </List.Item>

      {competition['using_payment_integrations?'] && (
        <List.Item>
          {/* i18n-tasks-use t('competitions.competition_info.use_stripe_link_html') */}
          {/* i18n-tasks-use t('competitions.competition_info.use_stripe_below_html') */}
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
        </List.Item>
      )}

      <List.Item>
        {competition.refund_policy_percent || !competition['has_fees?']
          ? I18n.t('competitions.competition_info.refund_policy_html', {
            refund_policy_percent: `${competition.refund_policy_percent}%`,
            limit_date_and_time:
              getFullDateTimeString(DateTime.fromISO(competition.refund_policy_limit_date)),
          })
          : I18n.t('competitions.competition_info.no_refunds')}
      </List.Item>

      {competition.waiting_list_deadline_date
        && (
          <List.Item>
            {I18n.t(
              'competitions.competition_info.waiting_list_deadline_html',
              {
                waiting_list_deadline:
                  getFullDateTimeString(DateTime.fromISO(competition.waiting_list_deadline_date)),
              },
            )}
          </List.Item>
        )}
      {competition.competition_events.length > 1 && competition['has_event_change_deadline_date?'] && (
        <List.Item>
          <EventChangeDeadlineRequirements competition={competition} />
        </List.Item>
      )}

      <List.Item>
        {competition['on_the_spot_registration?'] ? (
          <OnTheSpotRegistrationRequirements competition={competition} />)
          : I18n.t('competitions.competition_info.no_on_the_spot_registration')}
      </List.Item>

      <List.Item>
        <GuestRequirements competition={competition} />
      </List.Item>

      {competition['guests_per_registration_limit_enabled?'] && (
        <List.Item>
          {I18n.t('competitions.competition_info.guest_limit', { count: competition.guests_per_registration_limit })}
        </List.Item>
      )}

      {competition['uses_qualification?'] && !competition.allow_registration_without_qualification && (
        <List.Item>
          {I18n.t('competitions.competition_info.require_qualification')}
        </List.Item>
      )}

      {competition['events_per_registration_limit_enabled?'] && (
        <List.Item>
          {I18n.t('competitions.competition_info.event_limit', { count: competition.events_per_registration_limit })}
          )
        </List.Item>
      )}

      {competition.extra_registration_requirements && (
        <List.Item>
          <br />
          <Markdown md={competition.extra_registration_requirements} id="competition-info-extra-requirements" />
        </List.Item>
      )}
    </List>
  );
}
