import React, { useMemo } from 'react';
import { Header } from 'semantic-ui-react';
import { CSVLink } from 'react-csv';
import DelegatesTable from './DelegatesTable';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { apiV0Urls } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import I18n from '../../lib/i18n';
import dateSince from '../../lib/helpers/date-since';

const otherDelegatesHeaders = [
  { label: 'Delegate Name', key: 'user.name' },
  { label: 'WCA ID', key: 'user.wca_id' },
  { label: 'Status', key: 'status' },
  { label: 'Location', key: 'metadata.location' },
  { label: 'First Delegated', key: 'metadata.first_delegated' },
  { label: 'Last Delegated', key: 'metadata.last_delegated' },
  { label: 'Total Delegated', key: 'metadata.total_delegated' },
  { label: 'Date Since Last Delegated', key: 'date_since_last_delegated' },
  { label: 'Lead Delegated Competitions', key: 'metadata.lead_delegated_competitions' },
];

export default function DelegatesOfAllRegion() {
  const {
    data: seniorAndRegionalDelegates,
    loading: seniorAndRegionalDelegatesLoading,
    error: seniorAndRegionalDelegatesError,
  } = useLoadedData(apiV0Urls.userRoles.list({
    groupType: groupTypes.delegate_regions,
    isActive: true,
    isLead: true,
  }, 'name'));
  const {
    data: otherDelegates,
    loading: otherDelegatesLoading,
    error: otherDelegatesError,
  } = useLoadedData(apiV0Urls.userRoles.list(
    {
      groupType: groupTypes.delegate_regions,
      isActive: true,
      isLead: false,
    },
    'name',
    1000, // Increasing per page limit to 1000 because there are that many delegates that has to be
    // shown in the same page.
  ));
  const otherDelegatesWithExtraData = useMemo(() => otherDelegates?.map((delegate) => ({
    ...delegate,
    status: I18n.t(`enums.user_roles.status.delegate_regions.${delegate.metadata.status}`),
    date_since_last_delegated: dateSince(delegate.metadata.last_delegated),
  })), [otherDelegates]);

  if (seniorAndRegionalDelegatesLoading || otherDelegatesLoading) return <Loading />;
  if (seniorAndRegionalDelegatesError || otherDelegatesError) return <Errored />;

  return (
    <>
      <Header as="h3">Senior & Regional Delegates</Header>
      <DelegatesTable
        delegates={seniorAndRegionalDelegates}
        isAdminMode
        isAllSeniorAndRegionalDelegates
      />
      <Header as="h3">
        Other Delegates
      </Header>
      <CSVLink
        data={otherDelegatesWithExtraData}
        headers={otherDelegatesHeaders}
        filename="Delegates.csv"
      >
        Download CSV
      </CSVLink>
      <DelegatesTable
        delegates={otherDelegatesWithExtraData}
        isAdminMode
        isAllSeniorAndRegionalDelegates
      />
    </>
  );
}
