import React, { useState } from 'react';

import {
  Button, Grid, GridColumn, GridRow, List,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import I18n from '../../../lib/i18n';
import Markdown from '../../Markdown';
import RegistrationRequirements from '../Requirements/RegistrationRequirements';
import { getFullDateTimeString } from '../../../lib/utils/dates';
import WinnerTable from '../WinnerTable';
import InformationGrid from './InformationGrid';
import OneColumnGridEntry from './OneColumnGridEntry';

export default function GeneralInfoTab({
  competition,
  userInfo,
  records,
  winners,
  media = [],
}) {
  const [showRegistrationRequirements, setShowRegistrationRequirements] = useState(!competition['is_probably_over?']);
  const [showHighlights, setShowHighlights] = useState(true);

  return (
    <Grid padded>
      <GridRow>
        <InformationGrid competition={competition} media={media} />
      </GridRow>
      <GridRow>
        <GridColumn width={16}>
          <Grid padded>
            {competition.registration_open && competition.registration_close && (
            <OneColumnGridEntry header={I18n.t('competitions.competition_info.registration_period.label')}>
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
            </OneColumnGridEntry>
            )}
            <OneColumnGridEntry header={I18n.t('competitions.competition_info.registration_requirements')}>
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
            </OneColumnGridEntry>
            {competition['results_posted?'] && (competition.main_event_id || records) && (
              <OneColumnGridEntry header={I18n.t('competitions.competition_info.highlights')}>
                  {showHighlights ? (
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
                  )}
              </OneColumnGridEntry>
            )}
          </Grid>
        </GridColumn>
      </GridRow>
      { competition.winning_results.length > 0
        && (
        <Grid.Row>
          <GridColumn width={16}>
            <WinnerTable results={competition.winning_results} competition={competition} />
          </GridColumn>
        </Grid.Row>
        )}
    </Grid>
  );
}
