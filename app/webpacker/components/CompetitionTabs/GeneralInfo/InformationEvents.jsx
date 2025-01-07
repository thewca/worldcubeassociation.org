import React, { useCallback, useMemo, useState } from 'react';
import {
  Accordion, Divider, List, Popup, Statistic, StatisticGroup,
} from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../../lib/i18n';
import Markdown from '../../Markdown';
import { events } from '../../../lib/wca-data.js.erb';
import EventIcon from '../../wca/EventIcon';
import InformationList from './InformationList';

function EventsIconList({ competition, mainEventId }) {
  return competition.events.map((event) => (
    <React.Fragment key={event.id}>
      <Popup
        trigger={<EventIcon id={event.id} size={event.id === mainEventId ? '3em' : '1.5em'} />}
        content={event.id === mainEventId ? `${I18n.t('competitions.competition_info.main_event')}: ${events.byId[event.id].name}` : events.byId[event.id].name}
      />
    </React.Fragment>
  ));
}

const mediaTypes = ['report', 'article', 'multimedia'];

function MediaAccordion({ media }) {
  const [mediaIndex, setMediaIndex] = useState(-1);

  const handleMediaClick = useCallback((index) => {
    setMediaIndex((oldIdx) => (oldIdx === index ? -1 : index));
  }, [setMediaIndex]);

  return (
    <Accordion
      fluid
      styled
      exclusive
      activeIndex={mediaIndex}
    >
      {mediaTypes.map((mediaType, i) => {
        const mediaOfType = media.filter((m) => m.type === mediaType);

        if (mediaOfType.length <= 0) {
          return null;
        }

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
      })}
    </Accordion>
  );
}

export default function InformationEvents({ competition, media }) {
  const infoEntries = useMemo(() => {
    const entries = [
      {
        header: I18n.t('competitions.competition_info.information'),
        content: (<Markdown md={competition.information} id="competition-info-information" />),
      },
      {
        header: I18n.t('competitions.competition_info.events'),
        content: (<EventsIconList
          competition={competition}
          mainEventId={competition.main_event_id}
        />),
      }];

    if (media.length > 0) {
      entries.push(
        {
          content: (<MediaAccordion media={media} />),
        },
      );
    }

    return entries;
  }, [competition, media]);

  return (
    <>
      <StatisticGroup size="tiny" widths={competition['results_posted?'] ? 1 : 3}>
        {!competition['results_posted?']
          && (
            <Statistic>
              <Statistic.Label>{I18n.t('competitions.competition_info.number_of_bookmarks')}</Statistic.Label>
              <Statistic.Value>{competition.number_of_bookmarks}</Statistic.Value>
            </Statistic>
          )}
        {!competition['results_posted?'] && competition.competitor_limit_enabled
          && (
            <Statistic>
              <Statistic.Label>{I18n.t('competitions.competition_info.competitor_limit')}</Statistic.Label>
              <Statistic.Value>{competition.competitor_limit}</Statistic.Value>
            </Statistic>
          )}
        {competition['results_posted?']
          ? (
            <Statistic>
              <Statistic.Label>{I18n.t('competitions.nav.menu.competitors')}</Statistic.Label>
              <Statistic.Value>{competition.competitor_count}</Statistic.Value>
            </Statistic>
          )
          : (
            <Statistic>
              <Statistic.Label>{I18n.t('competitions.my_competitions_table.registrations')}</Statistic.Label>
              <Statistic.Value>{competition.registration_count}</Statistic.Value>
            </Statistic>
          )}
      </StatisticGroup>
      <Divider />
      <InformationList items={infoEntries} />
    </>
  );
}
