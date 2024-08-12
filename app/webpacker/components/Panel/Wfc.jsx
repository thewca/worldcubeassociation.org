import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';
import useLoggedInUserPermissions from '../../lib/hooks/useLoggedInUserPermissions';
import Loading from '../Requests/Loading';

export default function Wfc() {
  const { loggedInUserPermissions, loading } = useLoggedInUserPermissions();

  if (loading) return <Loading />;

  return (
    <PanelTemplate
      heading="WFC Panel"
      pages={[
        PANEL_PAGES.duesExport,
        PANEL_PAGES.countryBands,
        PANEL_PAGES.xeroUsers,
        PANEL_PAGES.duesRedirect,
        ...(loggedInUserPermissions.canAccessWfcSeniorMatters
          ? [PANEL_PAGES.delegateProbations] : []),
      ]}
    />
  );
}
