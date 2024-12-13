import React from 'react';

import { Header } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import { regulationsUrl } from '../../lib/requests/routes.js.erb';

export default function TimeLimitCutoffInfo({ competition }) {
  const showCumulativeOneRound = competition['uses_cumulative?'];
  const showCumulativeAcrossRounds = competition['uses_cumulative_across_rounds?'];
  const showCutoff = competition['uses_cutoff?'];
  const showQualifications = competition['uses_qualification?'];
  const dateToEvents = competition.qualification_date_to_events;

  return (
    <div>
      <Header>{I18n.t('competitions.events.time_limit')}</Header>
      <p>
        <I18nHTMLTranslate
          i18nKey="competitions.events.time_limit_information.time_limit_html"
          options={{
            regulation_link: `<a href="${regulationsUrl('#A1a4')}" target="_blank">${I18n.t(
              'competitions.events.time_limit_information.regulation_link_text',
              { number: 'A1a4' },
            )}</a>`,
          }}
        />

        {showCumulativeOneRound && (
          <>
            <br />
            <I18nHTMLTranslate
              i18nKey="competitions.events.time_limit_information.cumulative_one_round_html"
              options={{
                cumulative_time_limit: `<strong id="cumulative-time-limit">${I18n.t(
                  'competitions.events.time_limit_information.cumulative_time_limit',
                )}</strong>`,
                regulation_link: `<a href="${regulationsUrl('#A1a2')}" target="_blank">${I18n.t(
                  'competitions.events.time_limit_information.regulation_link_text',
                  { number: 'A1a2' },
                )}</a>`,
              }}
            />
          </>
        )}

        {showCumulativeAcrossRounds && (
          <>
            <br />
            <I18nHTMLTranslate
              i18nKey="competitions.events.time_limit_information.cumulative_across_rounds_html"
              options={{
                cumulative_time_limit: `<strong id="cumulative-across-rounds-time-limit">${I18n.t(
                  'competitions.events.time_limit_information.cumulative_time_limit',
                )}</strong>`,
                guideline_link: `<a href="${regulationsUrl(
                  '/guidelines.html#A1a2++',
                )}" target="_blank">${I18n.t(
                  'competitions.events.time_limit_information.guideline_link_text',
                  { number: 'A1a2++' },
                )}</a>`,
              }}
            />
          </>
        )}
      </p>

      {showCutoff && (
        <>
          <Header>{I18n.t('competitions.events.cutoff')}</Header>
          <p>
            <I18nHTMLTranslate
              i18nKey="competitions.events.time_limit_information.cutoff_html"
              options={{
                regulation_link: `<a href="${regulationsUrl('#9g')}" target="_blank">${I18n.t(
                  'competitions.events.time_limit_information.regulation_link_text',
                  { number: '9g' },
                )}</a>`,
              }}
            />
          </p>
        </>
      )}

      <Header id="format">{I18n.t('competitions.events.format')}</Header>
      <p>
        <I18nHTMLTranslate
          i18nKey="competitions.events.time_limit_information.format_html"
          options={{
            link_to_9b: `<a href="${regulationsUrl('#9b')}" target="_blank">${I18n.t(
              'competitions.events.time_limit_information.regulation_link_text',
              { number: '9b' },
            )}</a>`,
            link_to_9f: `<a href="${regulationsUrl('#9f')}" target="_blank">${I18n.t(
              'competitions.events.time_limit_information.regulation_link_text',
              { number: '9f' },
            )}</a>`,
          }}
        />
      </p>

      {showQualifications && (
        <>
          <Header>{I18n.t('competitions.events.qualification')}</Header>
          <p>
            {I18n.t('competitions.events.time_limit_information.qualification_html')}
            {dateToEvents.length > 1
              ? Object.entries(dateToEvents).map(([date, events]) => (
                <span key={date}>
                  <I18nHTMLTranslate
                    i18nKey="competitions.events.time_limit_information.qualification_some_events_html"
                    options={{
                      date: wcaDateRange(date, date),
                      events: events.map((e) => e.event.name).join(', '),
                    }}
                  />
                </span>
              ))
              : (
                <I18nHTMLTranslate
                  i18nKey="competitions.events.time_limit_information.qualification_all_events_html"
                  options={{
                    date: wcaDateRange(
                      Object.keys(dateToEvents)[0],
                      Object.keys(dateToEvents)[0],
                    ),
                  }}
                />
              )}
          </p>
        </>
      )}
    </div>
  );
}
