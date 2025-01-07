import React, { useMemo, useState } from 'react';
import { Button, Grid, List } from 'semantic-ui-react';
import { DateTime } from 'luxon';
import I18n from '../../../lib/i18n';
import Markdown from '../../Markdown';
import RegistrationRequirements from '../Requirements/RegistrationRequirements';
import { getFullDateTimeString } from '../../../lib/utils/dates';
import WinnerTable from '../WinnerTable';
import InformationList from './InformationList';
import DateAddressContact from './DateAddressContact';
import InformationEvents from './InformationEvents';

function RegistrationTime({ competition }) {
  if (competition['registration_not_yet_opened?']) {
    return I18n.t('competitions.competition_info.registration_period.range_future_html', {
      start_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_open), 'local', false),
      end_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_close), 'local', false),
    });
  }

  if (competition['registration_past?']) {
    return I18n.t('competitions.competition_info.registration_period.range_past_html', {
      start_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_open), 'local', false),
      end_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_close), 'local', false),
    });
  }

  return I18n.t('competitions.competition_info.registration_period.range_ongoing_html', {
    start_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_open), 'local', false),
    end_date_and_time: getFullDateTimeString(DateTime.fromISO(competition.registration_close), 'local', false),
  });
}

function RegistrationRequirementsToggle({ competition, userInfo }) {
  const [showRegistrationRequirements, setShowRegistrationRequirements] = useState(!competition['is_probably_over?']);

  return showRegistrationRequirements ? (
    <div>
      {competition['is_probably_over?']
          && (
            <Button onClick={() => setShowRegistrationRequirements(false)}>
              {I18n.t('competitions.competition_info.hide_requirements')}
            </Button>
          )}
      <RegistrationRequirements
        competition={competition}
        userInfo={userInfo}
        showLinksToRegisterPage
      />
    </div>
  ) : (
    <Button onClick={() => setShowRegistrationRequirements(true)}>
      {I18n.t('competitions.competition_info.click_to_display_requirements_html', { link_here: I18n.t('common.here') })}
    </Button>
  );
}

function CompetitionHighlights({ competition, winners, records = null }) {
  const [showHighlights, setShowHighlights] = useState(true);

  return showHighlights ? (
    <>
      <Button onClick={() => setShowHighlights(false)}>
        {I18n.t('competitions.competition_info.hide_highlights')}
      </Button>
      <List>
        <List.Item>{competition.main_event_id && <Markdown md={winners} id="competition-info-winners" />}</List.Item>
        {records && <List.Item><Markdown md={records} id="competition-info-records" /></List.Item>}
      </List>
    </>
  ) : (
    <Button onClick={() => setShowHighlights(true)}>
      {I18n.t('competitions.competition_info.click_to_display_highlights_html', {
        link_here: I18n.t('common.here'),
      })}
    </Button>
  );
}

export default function GeneralInfoTab({
  competition,
  userInfo,
  records,
  winners,
  media = [],
}) {
  const bottomItems = useMemo(() => {
    const items = [];
    if (competition.registration_open && competition.registration_close) {
      items.push({
        header: I18n.t('competitions.competition_info.registration_period.label'),
        content: (<RegistrationTime competition={competition} />),
      });
    }
    items.push({
      header: I18n.t('competitions.competition_info.registration_requirements'),
      content: (<RegistrationRequirementsToggle competition={competition} userInfo={userInfo} />),
    });
    if (competition['results_posted?'] && (competition.main_event_id || records)) {
      items.push({
        header: I18n.t('competitions.competition_info.highlights'),
        content: (
          <CompetitionHighlights competition={competition} records={records} winners={winners} />
        ),
      });
    }
    return items;
  }, [competition, records, userInfo, winners]);

  return (
    <Grid padded stackable>
      <Grid.Row>
        <Grid.Column width={8}>
          <DateAddressContact competition={competition} />
        </Grid.Column>
        <Grid.Column width={8}>
          <InformationEvents competition={competition} media={media} />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>
          <InformationList items={bottomItems} />
        </Grid.Column>
      </Grid.Row>
      {competition.winning_results.length > 0 && (
        <Grid.Row>
          <Grid.Column>
            <WinnerTable results={competition.winning_results} competition={competition} />
          </Grid.Column>
        </Grid.Row>
      )}
    </Grid>
  );
}
