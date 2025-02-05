import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import { continents, countries } from '../../../lib/wca-data.js.erb';
import { getRankings } from '../api/rankings';
import Loading from '../../Requests/Loading';
import DataTable from '../DataTable';
import {
  attemptResultColumn,
  competitionColumn,
  personColumn,
  rankColumn,
  regionColumn,
  representingColumn,
  resultsFiveWideColumn,
} from '../TableColumns';

function getCountryOrContinent(result, firstContinentIndex, firstCountryIndex, index) {
  if (index < firstContinentIndex) {
    return { name: I18n.t('results.table_elements.world') };
  }
  if (index >= firstContinentIndex && index < firstCountryIndex) {
    return continents.real.find((c) => c.id === countries.byId[result.countryId].continentId);
  }
  return countries.byId[result.countryId];
}

function mapRankingsData(data, isByRegion) {
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

export default function RankingsTable({ filterState }) {
  const {
    event, region, rankingType, gender, show,
  } = filterState;

  const isAverage = rankingType === 'average';

  const { data, isFetching } = useQuery({
    queryKey: ['rankings', event, region, rankingType, gender, show],
    queryFn: () => getRankings(event, rankingType, region, gender, show),
    select: (rankingsData) => mapRankingsData(rankingsData, show === 'by region'),
  });

  const columns = useMemo(() => [
    show === 'by region' ? regionColumn : rankColumn,
    personColumn,
    attemptResultColumn,
    show !== 'by region' && representingColumn,
    competitionColumn,
    isAverage && resultsFiveWideColumn,
  ].filter(Boolean), [show, isAverage]);

  if (isFetching) return <Loading />;

  return (
    <DataTable rows={data} config={columns} />
  );
}
