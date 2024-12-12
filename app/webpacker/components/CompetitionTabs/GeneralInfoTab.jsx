import React, { useState } from 'react';

import {
  Button, Grid, GridColumn, GridRow, Icon,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import I18n from '../../lib/i18n';
import { countries } from '../../lib/wca-data.js.erb';
import { competitionUrl, personUrl } from '../../lib/requests/routes.js.erb';
import EventIcon from '../wca/EventIcon';
import Markdown from '../Markdown';
import RegistrationRequirements from './Requirements';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import { getFullDateTimeString } from '../../lib/utils/dates';

const linkToGoogleMapsPlace = (latitude, longitude) => `https://www.google.com/maps/place/${latitude},${longitude}`;

export default function GeneralInfoTab({
  competition,
  userInfo,
}) {
  const [showRegistrationRequirements, setShowRegistrationRequirements] = useState(!competition['is_probably_over?']);
  const [showHighlights, setShowHighlights] = useState(false);

  return (
    <Grid>
      <GridRow>
        <GridColumn width={8}>
          <dl className="dl-horizontal compact">
            <dt>{I18n.t('competitions.competition_info.date')}</dt>
            <dd>
              {competition.date_range}
              <a
                href={competitionUrl(competition.id, 'ics')}
                title={I18n.t('competitions.competition_info.add_to_calendar')}
                data-toggle="tooltip"
                data-placement="top"
                data-container="body"
              >
                <Icon name="calendar plus" />
              </a>
            </dd>

            <dt>{I18n.t('competitions.competition_info.city')}</dt>
            <dd>
              {competition.city}
              {`, ${countries.byIso2[competition.country_iso2].name}`}
            </dd>

            <dt>{I18n.t('competitions.competition_info.venue')}</dt>
            <dd><Markdown md={competition.venue} id="competition-info-venue" /></dd>

            <dt className="text-muted">{I18n.t('competitions.competition_info.address')}</dt>
            <dd>
              <a href={linkToGoogleMapsPlace(
                competition.latitude_degrees,
                competition.longitude_degrees,
              )}
              >
                {competition.venue_address}
              </a>
            </dd>

            {competition.venue_details && (
            <>
              <dt className="text-muted">{I18n.t('competitions.competition_info.details')}</dt>
              <dd>{competition.venue_details}</dd>
            </>
            )}

            {competition.external_website && (
            <>
              <dt>{I18n.t('competitions.competition_info.website')}</dt>
              <dd>
                <a href={competition.website} target="_blank" rel="noopener noreferrer">
                  {`${competition.name} website`}
                </a>
              </dd>
            </>
            )}

            <dt>{I18n.t('competitions.competition_info.contact')}</dt>
            <dd>
              {competition.contact ? (
                <Markdown md={competition.contact} id="competition-info-contact" />
              ) : (
                <a
                  href={
                  `/contact?contactRecipient=competition&competitionId=${competition.id}`
                }
                >
                  {I18n.t('competitions.competition_info.organization_team')}
                </a>
              )}
            </dd>

            {competition.organizers.length > 0 && (
            <>
              <dt>{I18n.t('competitions.competition_info.organizer_plural', { count: competition.organizers.length })}</dt>
              <dd>
                {competition.organizers.map((user, i) => (user.wca_id ? (
                  <a href={personUrl(user.wca_id)}>
                    {user.name}
                    {i !== competition.organizers.length - 1 && ', '}
                  </a>
                ) : `${user.name} `))}
              </dd>
            </>
            )}

            <dt>{I18n.t('competitions.competition_info.delegate', { count: competition.delegates.length })}</dt>
            <dd>
              {competition.delegates.map((user, i) => (user.wca_id ? (
                <a href={personUrl(user.wca_id)}>
                  {user.name}
                  {i !== competition.delegates.length - 1 && ', '}
                </a>
              ) : `${user.name} `))}
            </dd>
          </dl>

          {competition['has_schedule?'] && (
          <dl className="dl-horizontal">
            <dt><Icon name="print" /></dt>
            <dd>
              <I18nHTMLTranslate
                i18nKey="competitions.competition_info.pdf.download_html"
                options={
                {
                  here: (
                    `<a
                      href=${competitionUrl(competition.id, 'pdf')}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ${I18n.t('common.here')}
                    </a>`
                  ),
                }
              }
              />
            </dd>
          </dl>
          )}
        </GridColumn>

        <GridColumn width={8}>
          <dl className="dl-horizontal">
            <dt>{I18n.t('competitions.competition_info.information')}</dt>
            <dd>
              <Markdown md={competition.information} id="competition-info-information" />
            </dd>
          </dl>

          <dl className="dl-horizontal">
            <dt>{I18n.t('competitions.competition_info.events')}</dt>
            <dd className="competition-events-list">
              {competition.events.map((event) => (
                <React.Fragment key={event.id}>
                  <EventIcon id={event.id} />
                </React.Fragment>
              ))}
            </dd>

            {competition.main_event_id && (
            <>
              <dt>{I18n.t('competitions.competition_info.main_event')}</dt>
              <dd className="competition-events-list">
                <EventIcon id={competition.main_event_id} />
              </dd>
            </>
            )}

            {competition['results_posted?'] && (
            <>
              <dt>{I18n.t('competitions.nav.menu.competitors')}</dt>
              <dd>{competition.competitors.length}</dd>
            </>
            )}
          </dl>

          {(competition.media.accepted ?? []).map((mediaType) => (
            <div className="panel panel-default" key={mediaType.type}>
              <div className="panel-heading">
                <h4 className="panel-title">
                  <a
                    data-toggle="collapse"
                    href={`#collapse-${mediaType.type}`}
                    className="collapsed"
                  >
                    {`${mediaType.type}s (${mediaType.items.length})`}
                  </a>
                </h4>
              </div>
              <div id={`collapse-${mediaType.type}`} className="panel-collapse collapse">
                <ul className="list-group">
                  {mediaType.items.map((item) => (
                    <a
                      href={item.uri}
                      className="list-group-item"
                      target="_blank"
                      rel="noopener noreferrer"
                      key={item.text}
                    >
                      {item.text}
                    </a>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {!competition['results_posted?'] && competition.competitor_limit_enabled && (
          <dl className="dl-horizontal">
            <dt>{I18n.t('competitions.competition_info.competitor_limit')}</dt>
            <dd>{competition.competitor_limit}</dd>
          </dl>
          )}

          {!competition['results_posted?'] && (
          <dl className="dl-horizontal">
            <dt>{I18n.t('competitions.competition_info.number_of_bookmarks')}</dt>
            <dd>{competition.number_of_bookmarks}</dd>
          </dl>
          )}
        </GridColumn>

        <GridColumn width={16}>
          {competition.registration_open && competition.registration_close && (
          <dl className="dl-horizontal">
            <dt>{I18n.t('competitions.competition_info.registration_period.label')}</dt>
            <dd>
              <p>
                {/* eslint-disable-next-line no-nested-ternary */}
                {competition['registration_not_yet_opened?']
                  ? I18n.t('competitions.competition_info.registration_period.range_future_html', {
                    start_date_and_time:
                      getFullDateTimeString(DateTime.fromISO(competition.registration_open)),
                    end_date_and_time:
                      getFullDateTimeString(DateTime.fromISO(competition.registration_close)),
                  })
                  : competition['registration_past?']
                    ? I18n.t('competitions.competition_info.registration_period.range_past_html', {
                      start_date_and_time:
                        getFullDateTimeString(DateTime.fromISO(competition.registration_open)),
                      end_date_and_time:
                        getFullDateTimeString(DateTime.fromISO(competition.registration_close)),
                    })
                    : I18n.t('competitions.competition_info.registration_period.range_ongoing_html', {
                      start_date_and_time:
                        getFullDateTimeString(DateTime.fromISO(competition.registration_open)),
                      end_date_and_time:
                        getFullDateTimeString(DateTime.fromISO(competition.registration_close)),
                    })}
              </p>
            </dd>
          </dl>
          )}

          <dl className="dl-horizontal">
            <dt>{I18n.t('competitions.competition_info.registration_requirements')}</dt>
            <dd>
              <div>
                {showRegistrationRequirements ? (
                  <>
                    <div>
                      <RegistrationRequirements
                        competition={competition}
                        userInfo={userInfo}
                        showLinksToRegisterPage
                      />
                    </div>
                    <Button onClick={() => setShowRegistrationRequirements(false)}>
                      {I18n.t('competitions.competition_info.hide_requirements')}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setShowRegistrationRequirements(true)}>
                    {I18n.t('competitions.competition_info.click_to_display_requirements_html')}
                  </Button>
                )}
              </div>
            </dd>
          </dl>

          {competition.userCanViewResults && (competition.main_event_id || records) && (
          <dl className="dl-horizontal">
            <dt>{I18n.t('competitions.competition_info.highlights')}</dt>
            <dd>
              <div>
                {showHighlights ? (
                  <>
                    <Button onClick={() => setShowHighlights(false)}>
                      {I18n.t('competitions.competition_info.hide_highlights')}
                    </Button>
                    <div>
                      {competition.main_event_id && <p>{winners(competition, competition.mainEvent)}</p>}
                      {records && <p>{records}</p>}
                    </div>
                  </>
                ) : (
                  <button onClick={() => setShowHighlights(true)}>
                    {I18n.t('competitions.competition_info.click_to_display_highlights_html')}
                  </button>
                )}
              </div>
            </dd>
          </dl>
          )}
        </GridColumn>
      </GridRow>
    </Grid>
  );
}
