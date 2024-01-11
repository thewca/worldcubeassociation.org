import { DateTime } from 'luxon';

const isContinent = (region) => region[0] === '_';

export function calculateQueryKey(filterState) {
  let timeKey = '';
  if (filterState?.timeOrder === 'past') {
    timeKey = `${filterState.selectedYear}`;
  } else if (filterState?.timeOrder === 'custom') {
    timeKey = `start${filterState.customStartDate}-end${filterState.customEndDate}`;
  }

  return {
    timeOrder: filterState?.timeOrder,
    region: filterState?.region,
    delegate: filterState?.delegate,
    search: filterState?.search,
    time: timeKey,
  };
}

export function createSearchParams(filterState, pageParam) {
  const {
    region, delegate, search, timeOrder, selectedYear, customStartDate, customEndDate,
  } = filterState;

  const dateNow = DateTime.now();
  const searchParams = new URLSearchParams({});

  if (region && region !== 'all_regions') {
    const regionParam = isContinent(region) ? 'continent' : 'country_iso2';
    searchParams.append(regionParam, region);
  }
  if (delegate) {
    searchParams.append('delegate', delegate);
  }
  if (search) {
    searchParams.append('q', search);
  }

  if (timeOrder === 'present') {
    searchParams.append('sort', 'start_date,end_date,name');
    searchParams.append('ongoing_and_future', dateNow.toFormat('yyyy-MM-dd'));
    searchParams.append('page', pageParam);
  } else if (timeOrder === 'recent') {
    const thirtyDaysAgo = dateNow.minus({ days: 30 });

    searchParams.append('sort', '-end_date,-start_date,name');
    searchParams.append('start', thirtyDaysAgo.toFormat('yyyy-MM-dd'));
    searchParams.append('end', dateNow.toFormat('yyyy-MM-dd'));
    searchParams.append('page', pageParam);
  } else if (timeOrder === 'past') {
    if (selectedYear === 'all_years') {
      searchParams.append('sort', '-end_date,-start_date,name');
      searchParams.append('end', dateNow.toFormat('yyyy-MM-dd'));
      searchParams.append('page', pageParam);
    } else {
      searchParams.append('sort', '-end_date,-start_date,name');
      searchParams.append('start', `${selectedYear}-1-1`);
      searchParams.append('end', dateNow.year === selectedYear ? dateNow.toFormat('yyyy-MM-dd') : `${selectedYear}-12-31`);
      searchParams.append('page', pageParam);
    }
  } else if (timeOrder === 'by_announcement') {
    searchParams.append('sort', '-announced_at,name');
    searchParams.append('page', pageParam);
  } else if (timeOrder === 'custom') {
    const startLuxon = DateTime.fromJSDate(customStartDate);
    const endLuxon = DateTime.fromJSDate(customEndDate);

    searchParams.append('sort', 'start_date,end_date,name');
    searchParams.append('start', startLuxon.isValid ? startLuxon.toFormat('yyyy-MM-dd') : '');
    searchParams.append('end', endLuxon.isValid ? endLuxon.toFormat('yyyy-MM-dd') : '');
    searchParams.append('page', pageParam);
  }

  return searchParams;
}
