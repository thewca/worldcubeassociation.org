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

  const dateNow = new Date();
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
    searchParams.append('ongoing_and_future', dateNow.toISOString().split('T')[0]);
    searchParams.append('page', pageParam);
  } else if (timeOrder === 'recent') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(dateNow.getDate() - 30);

    searchParams.append('sort', '-end_date,-start_date,name');
    searchParams.append('start', thirtyDaysAgo.toISOString().split('T')[0]);
    searchParams.append('end', dateNow.toISOString().split('T')[0]);
    searchParams.append('page', pageParam);
  } else if (timeOrder === 'past') {
    if (selectedYear === 'all_years') {
      searchParams.append('sort', '-end_date,-start_date,name');
      searchParams.append('end', dateNow.toISOString().split('T')[0]);
      searchParams.append('page', pageParam);
    } else {
      searchParams.append('sort', '-end_date,-start_date,name');
      searchParams.append('start', `${selectedYear}-1-1`);
      searchParams.append('end', dateNow.getFullYear() === selectedYear ? dateNow.toISOString().split('T')[0] : `${selectedYear}-12-31`);
      searchParams.append('page', pageParam);
    }
  } else if (timeOrder === 'by_announcement') {
    searchParams.append('sort', '-announced_at,name');
    searchParams.append('page', pageParam);
  } else if (timeOrder === 'custom') {
    searchParams.append('sort', 'start_date,end_date,name');
    searchParams.append('start', customStartDate?.toISOString().split('T')[0] || '');
    searchParams.append('end', customEndDate?.toISOString().split('T')[0] || '');
    searchParams.append('page', pageParam);
  }

  return searchParams;
}
