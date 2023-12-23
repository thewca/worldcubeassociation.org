import React from 'react';
import {
  subordinateDelegateClaimsUrl,
  subordinateUpcomingCompetitionsUrl,
} from '../../../lib/requests/routes.js.erb';
import DelegateProbations from '../../DelegateProbations';
import PanelTemplate from '../PanelTemplate';
import DelegateForms from './DelegateForms';

const sections = [
  {
    id: 'delegate-forms',
    name: 'Delegate Forms',
    component: DelegateForms,
  },
  {
    id: 'delegate-probations',
    name: 'Delegate Probations',
    component: DelegateProbations,
  },
  {
    id: 'subordinate-delegate-claims',
    name: 'Subordinate Delegate Claims',
    link: subordinateDelegateClaimsUrl,
  },
  {
    id: 'subordinate-upcoming-competitions',
    name: 'Subordinate Upcoming Competitions',
    link: subordinateUpcomingCompetitionsUrl,
  },
];

export default function SeniorDelegate() {
  return (
    <PanelTemplate heading="Senior Delegate Panel" sections={sections} />
  );
}
