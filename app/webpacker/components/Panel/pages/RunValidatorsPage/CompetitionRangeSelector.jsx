import React, { useEffect, useState } from 'react';
import { Form } from 'semantic-ui-react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import UtcDatePicker from '../../../wca/UtcDatePicker';
import getCompetitionList from './api/getCompetitionList';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';

const RUN_VALIDATORS_QUERY_CLIENT = new QueryClient();
const MAX_COMPETITIONS_PER_QUERY = 50;

export default function CompetitionRangeSelector({ range, setRange }) {
  const [startDate, setStartDate] = useState(range?.startDate);
  const [endDate, setEndDate] = useState(range?.endDate);

  const enableCompetitionListFetch = Boolean(startDate && endDate);

  const {
    data: competitionList, isLoading, isError, refetch,
  } = useQuery({
    queryKey: ['competitionCountInRange'],
    queryFn: () => getCompetitionList(startDate, endDate, MAX_COMPETITIONS_PER_QUERY),
    enabled: enableCompetitionListFetch,
  }, RUN_VALIDATORS_QUERY_CLIENT);

  useEffect(() => {
    setRange({ startDate, endDate });
    if (enableCompetitionListFetch) {
      refetch();
    }
  }, [startDate, endDate, setRange, enableCompetitionListFetch, refetch]);

  return (
    <>
      <Form.Field
        label="Start Date"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="yyyy-MM-dd"
        dropdownMode="select"
        isoDate={startDate}
        onChange={setStartDate}
      />
      <Form.Field
        label="End Date"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="yyyy-MM-dd"
        dropdownMode="select"
        isoDate={endDate}
        onChange={setEndDate}
      />
      {enableCompetitionListFetch && (
        <>
          {isLoading && (<Loading />)}
          {isError && <Errored />}
          {!isLoading && !isError && (
            <div>
              {`The checks will run for ${competitionList.length}${
                competitionList.length >= MAX_COMPETITIONS_PER_QUERY ? '+' : ''
              } competitions`}
            </div>
          )}
        </>
      )}
    </>
  );
}
