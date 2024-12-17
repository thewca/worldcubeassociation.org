import React, { useState } from 'react';
import {
  Accordion, Grid, GridColumn, Icon, List, Popup,
} from 'semantic-ui-react';
import _ from 'lodash';
import TwoColumnGridEntry from './TwoColumnGridEntry';
import I18n from '../../../lib/i18n';
import Markdown from '../../Markdown';
import { countries, events } from '../../../lib/wca-data.js.erb';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import EventIcon from '../../wca/EventIcon';
import { competitionUrl, contactCompetitionUrl, personUrl } from '../../../lib/requests/routes.js.erb';

const linkToGoogleMapsPlace = (latitude, longitude) => `https://www.google.com/maps/place/${latitude},${longitude}`;

function LeftColumn({ competition }) {
  return (
    <Grid padded>
      <TwoColumnGridEntry
        header={I18n.t('competitions.competition_info.date')}
      >
        {competition.date_range}
        <a
          href={competitionUrl(competition.id, 'ics')}
          title={I18n.t('competitions.competition_info.add_to_calendar')}
        >
          <Icon name="calendar plus" />
        </a>
      </TwoColumnGridEntry>

      <TwoColumnGridEntry
        header={I18n.t('competitions.competition_info.city')}
      >
        {competition.city}
        {`, ${countries.byIso2[competition.country_iso2].name}`}
      </TwoColumnGridEntry>

      <TwoColumnGridEntry
        header={I18n.t('competitions.competition_info.venue')}
      >
        <Markdown md={competition.venue} id="competition-info-venue" />
      </TwoColumnGridEntry>

      <TwoColumnGridEntry
        header={I18n.t('competitions.competition_info.address')}
      >
        <a
          href={linkToGoogleMapsPlace(
            competition.latitude_degrees,
            competition.longitude_degrees,
          )}
        >
          {competition.venue_address}
        </a>
      </TwoColumnGridEntry>

      {competition.venue_details && (
      <TwoColumnGridEntry
        header={I18n.t('competitions.competition_info.details')}
      >
        {competition.venue_details}
      </TwoColumnGridEntry>
      )}

      {competition.external_website && (
      <TwoColumnGridEntry
        header={I18n.t('competitions.competition_info.website')}
      >
        <a
          href={competition.external_website}
          target="_blank"
          rel="noopener noreferrer"
        >
          {`${competition.name} website`}
        </a>
      </TwoColumnGridEntry>
      )}

      <TwoColumnGridEntry
        header={I18n.t('competitions.competition_info.contact')}
      >
        {competition.contact ? (
          <Markdown md={competition.contact} id="competition-info-contact" />
        ) : (
          <a
            href={contactCompetitionUrl(competition.id)}
          >
            {I18n.t('competitions.competition_info.organization_team')}
          </a>
        )}
      </TwoColumnGridEntry>

      {competition.organizers.length > 0 && (
      <TwoColumnGridEntry
        header={I18n.t('competitions.competition_info.organizer_plural', {
          count: competition.organizers.length,
        })}
      >
        {competition.organizers
          .toSorted((o1, o2) => o1.name.localeCompare(o2.name))
          .map((user, i) => (
            <React.Fragment key={user.id || i}>
              {user.wca_id ? (
                <a href={personUrl(user.wca_id)}>{user.name}</a>
              ) : (
                user.name
              )}
              {i !== competition.organizers.length - 1 && ', '}
            </React.Fragment>
          ))}
      </TwoColumnGridEntry>
      )}

      <TwoColumnGridEntry
        header={I18n.t('competitions.competition_info.delegate', {
          count: competition.delegates.length,
        })}
      >
        {competition.delegates
          .toSorted((d1, d2) => d1.name.localeCompare(d2.name))
          .map((user, i) => (
            <React.Fragment key={user.id || i}>
              {user.wca_id ? (
                <a href={personUrl(user.wca_id)}>{user.name}</a>
              ) : (
                user.name
              )}
              {i !== competition.delegates.length - 1 && ', '}
            </React.Fragment>
          ))}
      </TwoColumnGridEntry>

      {competition['has_schedule?'] && (
      <TwoColumnGridEntry
        icon="print"
      >
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
      </TwoColumnGridEntry>
      )}
    </Grid>
  );
}

function RightColumn({ competition, media }) {
  const [mediaIndex, setMediaIndex] = useState(-1);
  const handleMediaClick = (index) => {
    setMediaIndex(mediaIndex === index ? -1 : index);
  };
  return (
    <Grid padded>
      <TwoColumnGridEntry header={I18n.t('competitions.competition_info.information')}>
        <Markdown md={competition.information} id="competition-info-information" />
      </TwoColumnGridEntry>

      <TwoColumnGridEntry header={I18n.t('competitions.competition_info.events')} padded>
        {competition.events.map((event) => (
          <React.Fragment key={event.id}>
            <Popup trigger={<EventIcon id={event.id} size="1.5em" />} content={events.byId[event.id].name} />
            {' '}
          </React.Fragment>
        ))}
      </TwoColumnGridEntry>

      {competition.main_event_id && (
        <TwoColumnGridEntry header={I18n.t('competitions.competition_info.main_event')} padded>
          <Popup trigger={<EventIcon id={competition.main_event_id} size="1.5em" />} content={events.byId[competition.main_event_id].name} />
        </TwoColumnGridEntry>
      )}

      {competition['results_posted?'] && (
        <TwoColumnGridEntry header={I18n.t('competitions.nav.menu.competitors')} padded>
          {competition.competitor_count}
        </TwoColumnGridEntry>
      )}
      { media.length > 0 && (
        <TwoColumnGridEntry>
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
        </TwoColumnGridEntry>
      ) }

      {!competition['results_posted?'] && competition.competitor_limit_enabled && (
        <TwoColumnGridEntry header={I18n.t('competitions.competition_info.competitor_limit')} padded>
          {competition.competitor_limit}
        </TwoColumnGridEntry>
      )}

      {!competition['results_posted?'] && (
        <TwoColumnGridEntry header={I18n.t('competitions.competition_info.number_of_bookmarks')} padded>
          {competition.number_of_bookmarks}
        </TwoColumnGridEntry>
      )}
    </Grid>
  );
}

export default function InformationGrid({ competition, media }) {
  return (
    <>
      <GridColumn width={8} only="computer">
        <LeftColumn competition={competition} />
      </GridColumn>
      <GridColumn width={16} only="tablet mobile">
        <LeftColumn competition={competition} />
      </GridColumn>
      <GridColumn width={8} only="computer">
        <RightColumn media={media} competition={competition} />
      </GridColumn>
      <GridColumn width={16} only="tablet mobile">
        <RightColumn media={media} competition={competition} />
      </GridColumn>
    </>
  );
}
