import React, { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header, Icon, Table } from 'semantic-ui-react';
import _ from 'lodash';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';
import { ResultRowHeader } from '../../ResultsData/Results/ResultRowHeader';
import ResultRowBody from '../../ResultsData/Results/ResultRowBody';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { competitionPreviewLiveResultsUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';
import { parseActivityCode } from '../../../lib/utils/wcif';
import EventIcon from '../../wca/EventIcon';

async function getLiveResultsPreview({ competitionId }) {
  const { data } = await fetchJsonOrError(
    competitionPreviewLiveResultsUrl(competitionId),
  );
  return data || [];
}

export default function LiveResultsPreview({
  competitionId,
}) {
  const {
    data: liveResults,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['live-results', competitionId],
    queryFn: () => getLiveResultsPreview({ competitionId }),
  });

  if (isPending) return (<Loading />);
  if (isError) return (<Errored error={error} />);

  const liveResultsByRound = _.groupBy(liveResults, 'round_wcif_id');

  return (
    <>
      {_.map(liveResultsByRound, (results, roundId) => {
        const { eventId, roundNumber } = parseActivityCode(roundId);

        return (
          <Fragment key={roundId}>
            <Header>
              <EventIcon id={eventId} baseComponent={Icon} />
              {I18n.t(`events.${eventId}`)}
              {' '}
              {I18n.t('competitions.results_table.round')}
              {' '}
              {roundNumber}
            </Header>
            <Table
              striped
              compact="very"
              singleLine
            >
              <Table.Header>
                <ResultRowHeader />
              </Table.Header>
              <Table.Body>
                <ResultRowBody round={{ results }} />
              </Table.Body>
            </Table>
          </Fragment>
        );
      })}
    </>
  );
}
