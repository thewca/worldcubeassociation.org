import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_LIST } from '../../lib/wca-data.js.erb';
import BannedCompetitorsPage from './pages/BannedCompetitorsPage';

const sections = [
  {
    id: PANEL_LIST.weat.bannedCompetitors,
    name: 'Banned Competitors',
    component: BannedCompetitorsPage,
  },
];

export default function Weat() {
  return (
    <PanelTemplate heading="WEAT Panel" sections={sections} />
  );
}
