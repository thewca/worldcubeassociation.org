import I18n from '../../../lib/i18n';
import { continents, countries } from '../../../lib/wca-data.js.erb';

function getCountryOrContinent(result, firstContinentIndex, firstCountryIndex, index) {
  if (index < firstContinentIndex) {
    return { name: I18n.t('results.table_elements.world') };
  }
  if (index >= firstContinentIndex && index < firstCountryIndex) {
    return continents.real.find((c) => c.id === countries.byId[result.countryId].continentId);
  }
  return countries.byId[result.countryId];
}

export function mapRankingsData(data, isByRegion) {
  const { rows, competitionsById } = data;
  const [rowsToMap, firstContinentIndex, firstCountryIndex] = isByRegion ? rows : [rows, 0, 0];

  return rowsToMap.reduce((acc, result, index) => {
    const competition = competitionsById[result.competitionId];
    const { value } = result;

    const previousItem = acc[acc.length - 1];
    const previousValue = previousItem?.result.value || 0;
    const previousRank = previousItem?.rank || 0;

    const rank = value === previousValue ? previousRank : index + 1;
    const tiedPrevious = rank === previousRank;

    const country = getCountryOrContinent(result, firstContinentIndex, firstCountryIndex, index);

    return [...acc, {
      result,
      competition,
      country,
      rank,
      tiedPrevious,
    }];
  }, []);
}
