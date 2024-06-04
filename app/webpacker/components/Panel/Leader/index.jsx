import React from 'react';
import PanelTemplate from '../PanelTemplate';
import LeaderForms from './LeaderForms';
import GroupsManager from './GroupsManager';
import { PANEL_LIST } from '../../../lib/wca-data.js.erb';
import BannedCompetitorsPage from '../pages/BannedCompetitorsPage';

const sections = [
  {
    id: PANEL_LIST.leader.leaderForms,
    name: 'Leader Forms',
    component: LeaderForms,
  },
  {
    id: PANEL_LIST.leader.groupsManager,
    name: 'Groups Manager',
    component: GroupsManager,
  },
  {
    id: PANEL_LIST.leader.bannedCompetitors,
    name: 'Banned Competitors',
    component: BannedCompetitorsPage,
  },
];

export default function Leader({ loggedInUserId }) {
  return (
    <PanelTemplate heading="Leader Panel" sections={sections} loggedInUserId={loggedInUserId} />
  );
}
