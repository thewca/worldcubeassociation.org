import React, { useState } from 'react';

import {
  Accordion,
  Button, Grid, GridColumn, GridRow, Header, Icon, List,
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
  records,
  winners,
  media = [],
}) {
  const [showRegistrationRequirements, setShowRegistrationRequirements] = useState(!competition['is_probably_over?']);
  const [showHighlights, setShowHighlights] = useState(true);
  const [mediaIndex, setMediaIndex] = useState(-1);

  const handleMediaClick = (index) => {
    setMediaIndex(mediaIndex === index ? -1 : index);
  };

  return (
    <Grid>
      <GridRow>
        <GridColumn width={8}>
          <Grid>
            <Grid.Row verticalAlign="middle" style={{ paddingBottom: '0em' }}>
              <Grid.Column width={4} textAlign="right">
                <Header as="h5">{I18n.t('competitions.competition_info.date')}</Header>
              </Grid.Column>
              <Grid.Column width={12}>
                {competition.date_range}
                <a
                  href={competitionUrl(competition.id, 'ics')}
                  title={I18n.t('competitions.competition_info.add_to_calendar')}
                >
                  <Icon name="calendar plus" />
                </a>
              </Grid.Column>
            </Grid.Row>

            <Grid.Row verticalAlign="middle" style={{ padding: '0em' }}>
              <Grid.Column width={4} textAlign="right">
                <Header as="h5">{I18n.t('competitions.competition_info.city')}</Header>
              </Grid.Column>
              <Grid.Column width={12}>
                {competition.city}
                {`, ${countries.byIso2[competition.country_iso2].name}`}
              </Grid.Column>
            </Grid.Row>

            <Grid.Row verticalAlign="middle" style={{ padding: '0em' }}>
              <Grid.Column width={4} textAlign="right">
                <Header as="h5">{I18n.t('competitions.competition_info.venue')}</Header>
              </Grid.Column>
              <Grid.Column width={12}>
                <Markdown md={competition.venue} id="competition-info-venue" />
              </Grid.Column>
            </Grid.Row>

            <Grid.Row verticalAlign="middle" style={{ padding: '0em' }}>
              <Grid.Column width={4} textAlign="right">
                <Header as="h5" className="text-muted">
                  {I18n.t('competitions.competition_info.address')}
                </Header>
              </Grid.Column>
              <Grid.Column width={12}>
                <a
                  href={linkToGoogleMapsPlace(
                    competition.latitude_degrees,
                    competition.longitude_degrees,
                  )}
                >
                  {competition.venue_address}
                </a>
              </Grid.Column>
            </Grid.Row>

            {competition.venue_details && (
              <Grid.Row verticalAlign="middle" style={{ padding: '0em' }}>
                <Grid.Column width={4} textAlign="right">
                  <Header as="h5" className="text-muted">
                    {I18n.t('competitions.competition_info.details')}
                  </Header>
                </Grid.Column>
                <Grid.Column width={12}>{competition.venue_details}</Grid.Column>
              </Grid.Row>
            )}

            {competition.external_website && (
              <Grid.Row verticalAlign="middle" style={{ paddingBottom: '0em' }}>
                <Grid.Column width={4} textAlign="right">
                  <Header as="h5">
                    {I18n.t('competitions.competition_info.website')}
                  </Header>
                </Grid.Column>
                <Grid.Column width={12}>
                  <a
                    href={competition.external_website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {`${competition.name} website`}
                  </a>
                </Grid.Column>
              </Grid.Row>
            )}

            <Grid.Row style={{ padding: '0em' }}>
              <Grid.Column width={4} textAlign="right">
                <Header as="h5">
                  {I18n.t('competitions.competition_info.contact')}
                </Header>
              </Grid.Column>
              <Grid.Column width={12}>
                {competition.contact ? (
                  <Markdown md={competition.contact} id="competition-info-contact" />
                ) : (
                  <a
                    href={`/contact?contactRecipient=competition&competitionId=${competition.id}`}
                  >
                    {I18n.t('competitions.competition_info.organization_team')}
                  </a>
                )}
              </Grid.Column>
            </Grid.Row>

            {competition.organizers.length > 0 && (
              <Grid.Row style={{ padding: '0em' }}>
                <Grid.Column width={4} textAlign="right">
                  <Header as="h5">
                    {I18n.t('competitions.competition_info.organizer_plural', {
                      count: competition.organizers.length,
                    })}
                  </Header>
                </Grid.Column>
                <Grid.Column width={12}>
                  {competition.organizers.map((user, i) => (
                    <React.Fragment key={user.id || i}>
                      {user.wca_id ? (
                        <a href={personUrl(user.wca_id)}>{user.name}</a>
                      ) : (
                        user.name
                      )}
                      {i !== competition.organizers.length - 1 && ', '}
                    </React.Fragment>
                  ))}
                </Grid.Column>
              </Grid.Row>
            )}

            <Grid.Row style={{ padding: '0em' }}>
              <Grid.Column width={4} textAlign="right">
                <Header as="h5">
                  {I18n.t('competitions.competition_info.delegate', {
                    count: competition.delegates.length,
                  })}
                </Header>
              </Grid.Column>
              <Grid.Column width={12}>
                {competition.delegates.map((user, i) => (
                  <React.Fragment key={user.id || i}>
                    {user.wca_id ? (
                      <a href={personUrl(user.wca_id)}>{user.name}</a>
                    ) : (
                      user.name
                    )}
                    {i !== competition.delegates.length - 1 && ', '}
                  </React.Fragment>
                ))}
              </Grid.Column>
            </Grid.Row>
            {competition['has_schedule?'] && (
              <Grid.Row>
                <Grid.Column width={4} textAlign="right">
                  <Header as="h5">
                    <Icon name="print" />
                  </Header>
                </Grid.Column>
                <GridColumn width={12}>
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
                </GridColumn>
              </Grid.Row>
            )}
          </Grid>
        </GridColumn>

        <GridColumn width={8}>
          <Grid>
            <Grid.Row verticalAlign="top">
              <Grid.Column width={4} textAlign="right">
                <Header as="h5">{I18n.t('competitions.competition_info.information')}</Header>
              </Grid.Column>
              <Grid.Column width={12} verticalAlign="top">
                <Markdown md={competition.information} id="competition-info-information" />
              </Grid.Column>
            </Grid.Row>

            <Grid.Row verticalAlign="middle">
              <Grid.Column width={4} textAlign="right">
                <Header as="h5">{I18n.t('competitions.competition_info.events')}</Header>
              </Grid.Column>
              <Grid.Column width={12} className="competition-events-list">
                {competition.events.map((event) => (
                  <React.Fragment key={event.id}>
                    <EventIcon id={event.id} size="1.5em" />
                  </React.Fragment>
                ))}
              </Grid.Column>
            </Grid.Row>

            {competition.main_event_id && (
              <Grid.Row verticalAlign="middle">
                <Grid.Column width={4} textAlign="right">
                  <Header as="h5">{I18n.t('competitions.competition_info.main_event')}</Header>
                </Grid.Column>
                <Grid.Column width={12} className="competition-events-list">
                  <EventIcon id={competition.main_event_id} />
                </Grid.Column>
              </Grid.Row>
            )}
            {competition['results_posted?'] && (
              <Grid.Row verticalAlign="middle">
                <Grid.Column width={4} textAlign="right">
                  <Header as="h5">{I18n.t('competitions.nav.menu.competitors')}</Header>
                </Grid.Column>
                <Grid.Column width={12}>{competition.competitor_count}</Grid.Column>
              </Grid.Row>
            )}
            { media && (
              <Grid.Row>
                <Accordion
                  fluid
                  styled
                  exclusive
                  activeIndex={mediaIndex}
                >
                  {['report', 'article', 'multimedia'].map((mediaType, i) => {
                    const mediaOfType = media.filter((m) => m.type === mediaType);
                    if (mediaOfType.length > 0) {
                      return (
                        <React.Fragment key={mediaType}>
                          <Accordion.Title onClick={() => handleMediaClick(i)}>
                            {`${_.capitalize(mediaType)} (${mediaOfType.length})`}
                          </Accordion.Title>
                          <Accordion.Content active={mediaIndex === i}>
                            <List>
                              {mediaOfType.map((item) => (
                                <List.Item>
                                  <a
                                    href={item.uri}
                                    className="list-group-item"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    key={item.text}
                                  >
                                    {item.text}
                                  </a>
                                </List.Item>
                              ))}
                            </List>
                          </Accordion.Content>
                        </React.Fragment>
                      );
                    }
                  })}
                </Accordion>
              </Grid.Row>
            ) }

            {!competition['results_posted?'] && competition.competitor_limit_enabled && (
              <Grid.Row verticalAlign="middle">
                <Grid.Column width={4} textAlign="right">
                  <Header as="h5">{I18n.t('competitions.competition_info.competitor_limit')}</Header>
                </Grid.Column>
                <Grid.Column width={12}>
                  {competition.competitor_limit}
                </Grid.Column>
              </Grid.Row>
            )}

            {!competition['results_posted?'] && (
              <Grid.Row verticalAlign="middle">
                <Grid.Column width={4} textAlign="right">
                  <Header as="h5">{I18n.t('competitions.competition_info.number_of_bookmarks')}</Header>
                </Grid.Column>
                <Grid.Column width={12}>
                  {competition.number_of_bookmarks}
                </Grid.Column>
              </Grid.Row>
            )}
          </Grid>

        </GridColumn>
        <GridColumn width={16}>
          <br />
          <Grid>
            {competition.registration_open && competition.registration_close && (
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Header as="h5">{I18n.t('competitions.competition_info.registration_period.label')}</Header>
                </Grid.Column>
                <Grid.Column width={14}>
                  <p>
                    {competition['registration_not_yet_opened?']
                      ? I18n.t('competitions.competition_info.registration_period.range_future_html', {
                        start_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_open)),
                        end_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_close)),
                      })
                      : competition['registration_past?']
                        ? I18n.t('competitions.competition_info.registration_period.range_past_html', {
                          start_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_open)),
                          end_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_close)),
                        })
                        : I18n.t('competitions.competition_info.registration_period.range_ongoing_html', {
                          start_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_open)),
                          end_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_close)),
                        })}
                  </p>
                </Grid.Column>
              </Grid.Row>
            )}

            <Grid.Row>
              <Grid.Column width={2} textAlign="right">
                <Header as="h5">{I18n.t('competitions.competition_info.registration_requirements')}</Header>
              </Grid.Column>
              <Grid.Column width={14}>
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
                      {competition['is_probably_over?']
                        && (
                          <Button onClick={() => setShowRegistrationRequirements(false)}>
                            {I18n.t('competitions.competition_info.hide_requirements')}
                          </Button>
                        )}
                    </>
                  ) : (
                    <Button onClick={() => setShowRegistrationRequirements(true)}>
                      {I18n.t('competitions.competition_info.click_to_display_requirements_html', { link_here: I18n.t('common.here') })}
                    </Button>
                  )}
                </div>
              </Grid.Column>
            </Grid.Row>
            {competition['results_posted?'] && (competition.main_event_id || records) && (
              <Grid.Row>
                <Grid.Column width={2} textAlign="right">
                  <Header as="h5">{I18n.t('competitions.competition_info.highlights')}</Header>
                </Grid.Column>
                <Grid.Column width={14}>
                  <div>
                    {showHighlights ? (
                      <>
                        <Button onClick={() => setShowHighlights(false)}>
                          {I18n.t('competitions.competition_info.hide_highlights')}
                        </Button>
                        <div>
                          {competition.main_event_id && <Markdown md={winners} id="competition-info-winners" />}
                          <br />
                          {records && <Markdown md={records} id="competition-info-records" />}
                        </div>
                      </>
                    ) : (
                      <Button onClick={() => setShowHighlights(true)}>
                        {I18n.t('competitions.competition_info.click_to_display_highlights_html', {
                          link_here: I18n.t('common.here'),
                        })}
                      </Button>
                    )}
                  </div>
                </Grid.Column>
              </Grid.Row>
            )}
          </Grid>
        </GridColumn>
      </GridRow>
    </Grid>
  );
}
