import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import _ from 'lodash';
import { Accordion, Message } from 'semantic-ui-react';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import ResultsDataPreviewAccordion from './ResultsDataPreviewAccordion';

export default function ResultsDataPreview({
  dataType,
  competitionId,
  fetchResultsDataFn,
  dataSortingKey,
  rowHeaderComponent,
  rowComponent,
}) {
  const {
    data: importedTemporaryResultsData,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: [`imported-temporary-${dataType}`, competitionId],
    queryFn: () => fetchResultsDataFn({ competitionId }),
  });

  const roundDetails = useMemo(() => _.map(
    _.uniqBy(importedTemporaryResultsData, 'round_id'),
    (resultData) => ({
      roundId: resultData.round_id,
      roundTypeId: resultData.round_type_id,
      eventId: resultData.event_id,
    }),
  ), [importedTemporaryResultsData]);

  const groupedResultsData = useMemo(
    () => {
      const grouped = _.groupBy(importedTemporaryResultsData, 'round_id');

      return _.mapValues(
        grouped,
        (resultsData) => _.sortBy(resultsData, dataSortingKey),
      );
    },
    [importedTemporaryResultsData, dataSortingKey],
  );

  const [activeAccordion, setActiveAccordion] = useState(true);

  if (isError) return <Errored error={error} />;
  if (isPending) return <Loading />;

  return (
    <Accordion fluid styled>
      <Accordion.Title
        active={activeAccordion}
        onClick={() => setActiveAccordion((prevValue) => !prevValue)}
      >
        Preview imported
        {' '}
        {dataType}
      </Accordion.Title>
      <Accordion.Content active={activeAccordion}>
        <Message positive>
          Total no. of temporary
          {' '}
          {dataType}
          :
          {' '}
          {importedTemporaryResultsData.length}
        </Message>
        <ResultsDataPreviewAccordion
          dataType={dataType}
          roundDetails={roundDetails}
          groupedResultsData={groupedResultsData}
          rowHeaderComponent={rowHeaderComponent}
          rowComponent={rowComponent}
        />
      </Accordion.Content>
    </Accordion>
  );
}
