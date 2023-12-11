import React from 'react';
import DelegateProbations from '../../DelegateProbations';
import PanelTemplate from '../PanelTemplate';
import SeniorDelegatesList from './SeniorDelegatesList';
import RegionManager from './RegionManager';

const sections = [
  {
    id: 'senior-delegates-list',
    name: 'Senior Delegates List',
    component: SeniorDelegatesList,
  },
  {
    id: 'regions-manager',
    name: 'Regions Manager',
    component: RegionManager,
  },
  {
    id: 'delegate-probations',
    name: 'Delegate Probations',
    component: DelegateProbations,
  },
];

export default function Board() {
  return (
    <PanelTemplate heading="Board Panel" sections={sections} />
  );
}
