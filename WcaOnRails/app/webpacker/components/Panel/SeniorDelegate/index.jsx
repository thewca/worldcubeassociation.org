import React from 'react';
import {
  subordinateDelegateClaimsUrl,
  subordinateUpcomingCompetitionsUrl,
} from '../../../lib/requests/routes.js.erb';
import DelegateProbations from '../../DelegateProbations';
import PanelTemplate from '../PanelTemplate';
import DelegateForms from './DelegateForms';
import { PANEL_LIST } from '../../../lib/wca-data.js.erb';

const sections = [
  {
    id: PANEL_LIST.seniorDelegate.delegateForms,
    name: 'Delegate Forms',
    component: DelegateForms,
  },
  {
    id: PANEL_LIST.seniorDelegate.delegateProbations,
    name: 'Delegate Probations',
    component: DelegateProbations,
  },
  {
    id: PANEL_LIST.seniorDelegate.subordinateDelegateClaims,
    name: 'Subordinate Delegate Claims',
    link: subordinateDelegateClaimsUrl,
  },
  {
    id: PANEL_LIST.seniorDelegate.subordinateUpcomingCompetitions,
    name: 'Subordinate Upcoming Competitions',
    link: subordinateUpcomingCompetitionsUrl,
  },
];

export default function SeniorDelegate() {
  return (
    <PanelTemplate heading="Senior Delegate Panel" sections={sections} />
  );
}
