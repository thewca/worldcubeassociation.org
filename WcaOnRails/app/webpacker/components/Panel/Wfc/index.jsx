import React from 'react';
import { countryBandsUrl } from '../../../lib/requests/routes.js.erb';
import useLoggedInUserPermissions from '../../../lib/hooks/useLoggedInUserPermissions';
import Loading from '../../Requests/Loading';
import DelegateProbations from '../../DelegateProbations';
import DuesExport from './DuesExport';
import PanelTemplate from '../PanelTemplate';
import XeroUsers from './XeroUsers';
import DuesRedirect from './DuesRedirect';
import PANEL_LIST from '../PanelList';

const sections = [
  {
    id: PANEL_LIST.wfc.duesExport,
    name: 'Dues Export',
    component: DuesExport,
  },
  {
    id: PANEL_LIST.wfc.countryBands,
    name: 'Country Bands',
    link: countryBandsUrl,
  },
  {
    id: PANEL_LIST.wfc.delegateProbations,
    name: 'Delegate Probations',
    component: DelegateProbations,
    forAtLeastSeniorMember: true,
  },
  {
    id: PANEL_LIST.wfc.xeroUsers,
    name: 'Xero Users',
    component: XeroUsers,
  },
  {
    id: PANEL_LIST.wfc.duesRedirect,
    name: 'Dues Redirect',
    component: DuesRedirect,
  },
];

export default function Wfc() {
  const { loggedInUserPermissions, loading } = useLoggedInUserPermissions();

  if (loading) return <Loading />;
  return (
    <PanelTemplate
      heading="WFC Panel"
      sections={sections
        .filter(
          (section) => (!section.forAtLeastSeniorMember
              || loggedInUserPermissions.canAccessWfcSeniorMatters),
        )}
    />
  );
}
