import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import _ from 'lodash';
import { Accordion, Message } from 'semantic-ui-react';
import getImportedTemporaryResults from '../../api/competitionResult/getImportedTemporaryResults';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import WCAQueryClientProvider from '../../../../lib/providers/WCAQueryClientProvider';
import ResultsPreviewAccordion from './ResultsPreviewAccordion';

export default function Wrapper({ competitionId }) {
  return (
    <WCAQueryClientProvider>
      <ResultsPreview competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}

export function ResultsPreview({ competitionId }) {
  const {
    data: importedTemporaryResults,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['imported-temporary-results', competitionId],
    queryFn: () => getImportedTemporaryResults({ competitionId }),
  });

  const roundDetails = useMemo(() => _.map(
    _.uniqBy(importedTemporaryResults, 'round_id'),
    (result) => ({
      roundId: result.round_id,
      roundTypeId: result.round_type_id,
      eventId: result.event_id,
    }),
  ), [importedTemporaryResults]);

  const groupedResults = useMemo(
    () => {
      const grouped = _.groupBy(importedTemporaryResults, 'round_id');

      const roundIds = Object.keys(grouped);

      roundIds.forEach((roundId) => {
        grouped[roundId] = _.sortBy(grouped[roundId], 'pos');
      });

      return grouped;
    },
    [importedTemporaryResults],
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
        Preview imported results
      </Accordion.Title>
      <Accordion.Content active={activeAccordion}>
        <Message positive>
          Total no. of temporary results:
          {' '}
          {importedTemporaryResults.length}
        </Message>
        <ResultsPreviewAccordion roundDetails={roundDetails} groupedResults={groupedResults} />
      </Accordion.Content>
    </Accordion>
  );
}
