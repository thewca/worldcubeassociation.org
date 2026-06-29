import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import _ from 'lodash';
import { Accordion, Message } from 'semantic-ui-react';
import getImportedTemporaryScrambles from '../../api/competitionResult/getImportedTemporaryScrambles';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import WCAQueryClientProvider from '../../../../lib/providers/WCAQueryClientProvider';
import ScramblesPreviewAccordion from './ScramblesPreviewAccordion';

export default function Wrapper({ competitionId }) {
  return (
    <WCAQueryClientProvider>
      <ScramblesPreview competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}

export function ScramblesPreview({ competitionId }) {
  const {
    data: importedTemporaryScrambles,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['imported-temporary-scrambles', competitionId],
    queryFn: () => getImportedTemporaryScrambles({ competitionId }),
  });

  const roundDetails = useMemo(() => _.map(
    _.uniqBy(importedTemporaryScrambles, 'round_id'),
    (scramble) => ({
      roundId: scramble.round_id,
      roundTypeId: scramble.round_type_id,
      eventId: scramble.event_id,
    }),
  ), [importedTemporaryScrambles]);

  const groupedScrambles = useMemo(
    () => {
      const grouped = _.groupBy(importedTemporaryScrambles, 'round_id');

      const roundIds = Object.keys(grouped);

      roundIds.forEach((roundId) => {
        grouped[roundId] = _.sortBy(grouped[roundId], 'pos');
      });

      return grouped;
    },
    [importedTemporaryScrambles],
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
        Preview imported scrambles
      </Accordion.Title>
      <Accordion.Content active={activeAccordion}>
        <Message positive>
          Total no. of temporary scrambles:
          {' '}
          {importedTemporaryScrambles.length}
        </Message>
        <ScramblesPreviewAccordion
          roundDetails={roundDetails}
          groupedScrambles={groupedScrambles}
        />
      </Accordion.Content>
    </Accordion>
  );
}
