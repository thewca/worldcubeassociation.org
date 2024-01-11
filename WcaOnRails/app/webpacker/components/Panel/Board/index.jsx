import React from 'react';
import DelegateProbations from '../../DelegateProbations';
import PanelTemplate from '../PanelTemplate';
import SeniorDelegatesList from './SeniorDelegatesList';
import RegionManager from './RegionManager';
import CouncilLeaders from './CouncilLeaders';
import { PANEL_LIST } from '../../../lib/wca-data.js.erb';

const sections = [
  {
    id: PANEL_LIST.board.seniorDelegatesList,
    name: 'Senior Delegates List',
    component: SeniorDelegatesList,
  },
  {
    id: PANEL_LIST.board.councilLeaders,
    name: 'Council Leaders',
    component: CouncilLeaders,
  },
  {
    id: PANEL_LIST.board.regionsManager,
    name: 'Regions Manager',
    component: RegionManager,
  },
  {
    id: PANEL_LIST.board.delegateProbations,
    name: 'Delegate Probations',
    component: DelegateProbations,
  },
];

export default function Board() {
  return (
    <PanelTemplate heading="Board Panel" sections={sections} />
  );
}
