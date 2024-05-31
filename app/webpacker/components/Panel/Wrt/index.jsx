import React from 'react';
import PanelTemplate from '../PanelTemplate';
import { PANEL_LIST } from '../../../lib/wca-data.js.erb';
import PostingCompetitionsTable from '../../PostingCompetitions';
import EditPerson from './EditPerson';
import RegionManager from '../Board/RegionManager';
import GroupsManagerAdmin from '../pages/GroupsManagerAdmin';
import BannedCompetitorsPage from '../pages/BannedCompetitorsPage';

const sections = [
  {
    id: PANEL_LIST.wrt.postingDashboard,
    name: 'Posting Dashboard',
    component: PostingCompetitionsTable,
  },
  {
    id: PANEL_LIST.wrt.editPerson,
    name: 'Edit Person',
    component: EditPerson,
  },
  {
    id: PANEL_LIST.wrt.regionsManager,
    name: 'Regions Manager',
    component: RegionManager,
  },
  {
    id: PANEL_LIST.board.groupsManagerAdmin,
    name: 'Groups Manager Admin',
    component: GroupsManagerAdmin,
  },
  {
    id: PANEL_LIST.wrt.bannedCompetitors,
    name: 'Banned Competitors',
    component: BannedCompetitorsPage,
  },
];

export default function Wrt() {
  return (
    <PanelTemplate heading="WRT Panel" sections={sections} />
  );
}
