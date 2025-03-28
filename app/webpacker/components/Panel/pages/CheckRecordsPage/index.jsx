import React from 'react';
import { Header, List, Message } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { panelPageUrl } from '../../../../lib/requests/routes.js.erb';
import { cronjobs, PANEL_PAGES } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import getCronjobDetails from '../../views/CronJobStatus/api/getCronjobDetails';
import CheckRecordsForm from './CheckRecordsForm';

const CAD_CRONJOB_NAME = cronjobs.ComputeAuxiliaryData;

export default function CheckRecordsPage() {
  const {
    data: cronjobDetails, isFetching, isError,
  } = useQuery({
    queryKey: ['cronjob-details', CAD_CRONJOB_NAME],
    queryFn: () => getCronjobDetails({ cronjobName: CAD_CRONJOB_NAME }),
  });

  if (isFetching) return <Loading />;
  if (isError) return <Errored />;

  return (
    <>
      <Header>Check records</Header>
      <Information
        lastCadRunTime={cronjobDetails?.successful_run_start || 'never'}
      />
      <CheckRecordsForm />
    </>
  );
}

function Information({ lastCadRunTime }) {
  return (
    <>
      <p>
        This computes regional record markers for all successful results (value&gt;0). If a result
        has a stored or computed regional record marker, it is displayed. If the two markers differ,
        they&apos;re shown in red/green.
      </p>

      <p>
        Only strictly previous competitions (other.
        <b>end</b>
        Date &lt; this.
        <b>start</b>
        Date) are used to compare, not overlapping competitions. Thus I might wrongfully compute a
        too good record status (because a result was actually beaten earlier in an overlapping
        competition) but I should never wrongfully compute a too bad record status.
      </p>

      <p>
        Inside the same competition, results are sorted first by round, then by value, and then
        they&apos;re declared records on a first-come-first-served basis. This results in the
        records-are-updated-at-the-end-of-each-round rule you requested.
      </p>

      <p>
        A result does not need to beat another to get a certain record status, equaling is good
        enough.
      </p>

      <p>
        If you choose &apos;All&apos; both for event and competition, I only show the differences
        (otherwise the page would be huge).
      </p>

      <Message warning>
        <List bulleted>
          <List.Item>
            This script relies on auxiliary tables which are computed as part of
            {' '}
            <a href={panelPageUrl(PANEL_PAGES.computeAuxiliaryData)} target="_blank" rel="noreferrer">running CAD</a>
            .
          </List.Item>
          <List.Item>
            <b>
              The detected records will not automatically be up-to-date with the
              <code>Results</code>
              {' '}
              table by default.
            </b>
          </List.Item>
          <List.Item>
            {`Instead, they are up to date with CAD (last successful run: ${lastCadRunTime})`}
          </List.Item>
        </List>
      </Message>
    </>
  );
}
