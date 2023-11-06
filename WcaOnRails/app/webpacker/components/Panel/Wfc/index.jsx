import React from 'react';
import {
  panelWfcPageDataUrl,
  countryBandsUrl,
} from '../../../lib/requests/routes.js.erb';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import Errored from '../../Requests/Errored';
import Loading from '../../Requests/Loading';
import DelegateProbations from '../../DelegateProbations';
import DuesExport from './DuesExport';
import PanelTemplate from '../PanelTemplate';

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
];

export default function Wfc() {
  const { data, loading, error } = useLoadedData(panelWfcPageDataUrl);

  if (loading) return <Loading />;
  return (
      <>
        {error && <Errored />}
        <PanelTemplate
          heading="WFC Panel"
          sections={sections
            .filter((section) => !section.forAtleastSeniorMember || (data?.isAtleastSeniorMember == true))}
        />
      </>
    );
}
