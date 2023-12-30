import React from 'react';
import PanelTemplate from '../PanelTemplate';
import PANEL_LIST from '../PanelList';
import LeaderForms from './LeaderForms';
import GroupsManager from './GroupsManager';

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
];

export default function Leader({ loggedInUserId }) {
  return (
    <PanelTemplate heading="Leader Panel" sections={sections} loggedInUserId={loggedInUserId} />
  );
}
