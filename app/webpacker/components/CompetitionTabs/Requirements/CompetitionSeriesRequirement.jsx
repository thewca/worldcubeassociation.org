import React from 'react';
import I18n from '../../../lib/i18n';

export default function CompetitionSeriesRequirement({ competition }) {
  return (
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
  );
}
