import React from 'react';
import { countryBandsUrl } from '../../../lib/requests/routes.js.erb';
import useLoggedInUserPermissions from '../../../lib/hooks/useLoggedInUserPermissions';
import Loading from '../../Requests/Loading';
import DelegateProbations from '../../DelegateProbations';
import DuesExport from './DuesExport';
import PanelTemplate from '../PanelTemplate';
import XeroUsers from './XeroUsers';
import DuesRedirect from './DuesRedirect';

const sections = [
  {
    id: 'dues-export',
    name: 'Dues Export',
    component: DuesExport,
  },
  {
    id: 'country-bands',
    name: 'Country Bands',
    link: countryBandsUrl,
  },
  {
    id: 'delegate-probations',
    name: 'Delegate Probations',
    component: DelegateProbations,
    forAtleastSeniorMember: true,
  },
  {
    id: 'xero-users',
    name: 'Xero Users',
    component: XeroUsers,
  },
  {
    id: 'dues-redirect',
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
          (section) => (!section.forAtleastSeniorMember
              || loggedInUserPermissions.canAccessWfcSeniorStuff()),
        )}
    />
  );
}
