import React from 'react';
import { List } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';

export default function CompetitionSeriesRequirement({ competition }) {
  return (
    <>
      <p>
        {I18n.t('competitions.competition_info.part_of_a_series_list', {
          name: competition.competition_series.name,
        })}
      </p>
      <List>
        {competition.series_sibling_competitions.map((comp) => (
          <List.Item key={comp.id}>
            <a href={`/competitions/${comp.id}`}>{comp.name}</a>
          </List.Item>
        ))}
      </List>
      <p>{I18n.t('competitions.competition_info.series_registration_warning_html')}</p>
    </>
  );
}
