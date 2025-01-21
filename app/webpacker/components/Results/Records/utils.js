import _ from 'lodash';
import { countries } from '../../../lib/wca-data.js.erb';

export function augmentResults(results, competitionsById) {
  return results.map((result) => {
    const competition = competitionsById[result.competitionId];
    const country = countries.real.find((c) => c.id === result.countryId);

    return {
      result,
      competition,
      country,
      key: `${result.id}-${result.type}`,
    };
  });
}

export function augmentAndGroupResults(results, competitionsById) {
  return _.groupBy(augmentResults(results, competitionsById), 'result.eventId');
}
