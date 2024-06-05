import React from 'react';
import DelegateProbations from '../../DelegateProbations';
import PanelTemplate from '../PanelTemplate';
import SeniorDelegatesList from './SeniorDelegatesList';
import RegionManager from './RegionManager';
import { PANEL_LIST } from '../../../lib/wca-data.js.erb';
import GroupsManagerAdmin from '../pages/GroupsManagerAdmin';
import OfficersEditor from './OfficersEditor';
import RegionsAdmin from './RegionsAdmin';
import LeadersAdminPage from './LeadersAdminPage';
import BoardEditorPage from './BoardEditorPage';
import BannedCompetitorsPage from '../pages/BannedCompetitorsPage';

const sections = [
  {
    id: PANEL_LIST.board.seniorDelegatesList,
    name: 'Senior Delegates List',
    component: SeniorDelegatesList,
  },
  {
    id: PANEL_LIST.board.leadersAdmin,
    name: 'Leaders Admin',
    component: LeadersAdminPage,
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
  {
    id: PANEL_LIST.board.groupsManagerAdmin,
    name: 'Groups Manager Admin',
    component: GroupsManagerAdmin,
  },
  {
    id: PANEL_LIST.board.boardEditor,
    name: 'Board Editor',
    component: BoardEditorPage,
  },
  {
    id: PANEL_LIST.board.officersEditor,
    name: 'Officers Editor',
    component: OfficersEditor,
  },
  {
    id: PANEL_LIST.board.regionsAdmin,
    name: 'Regions Admin',
    component: RegionsAdmin,
  },
  {
    id: PANEL_LIST.board.bannedCompetitors,
    name: 'Banned Competitors',
    component: BannedCompetitorsPage,
  },
];

export default function Board() {
  return (
    <PanelTemplate heading="Board Panel" sections={sections} />
  );
}
