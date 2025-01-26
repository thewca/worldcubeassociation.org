import React from 'react';
import { Form } from 'semantic-ui-react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import UtcDatePicker from '../../../wca/UtcDatePicker';
import getCompetitionCount from './api/getCompetitionCount';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';

const RUN_VALIDATORS_QUERY_CLIENT = new QueryClient();

export default function CompetitionRangeSelector({ range, setRange }) {
  const bothDatesAreSelected = Boolean(range?.startDate && range?.endDate);

  const {
    data: competitionCount, isLoading, isError,
  } = useQuery({
    queryKey: ['competitionCountInRange', range?.startDate, range?.endDate],
    queryFn: () => getCompetitionCount(range?.startDate, range?.endDate),
    enabled: bothDatesAreSelected,
  }, RUN_VALIDATORS_QUERY_CLIENT);

  return (
    <>
      <Form.Field
        label="Start Date"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="yyyy-MM-dd"
        dropdownMode="select"
        isoDate={range?.startDate}
        onChange={(date) => {
          setRange({
            ...range,
            startDate: date,
          });
        }}
      />
      <Form.Field
        label="End Date"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="yyyy-MM-dd"
        dropdownMode="select"
        isoDate={range?.endDate}
        onChange={(date) => {
          setRange({
            ...range,
            endDate: date,
          });
        }}
      />
      {bothDatesAreSelected && (
        <CompetitionCountViewer
          isLoading={isLoading}
          isError={isError}
          competitionCount={competitionCount}
        />
      )}
    </>
  );
}

function CompetitionCountViewer({ isLoading, isError, competitionCount }) {
  if (isLoading) return <Loading />;
  if (isError) return <Errored />;
  return `The checks will run for ${competitionCount} competitions`;
}
