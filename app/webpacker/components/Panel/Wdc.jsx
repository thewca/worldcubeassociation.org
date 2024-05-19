import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_LIST } from '../../lib/wca-data.js.erb';
import BannedCompetitorsPage from './pages/BannedCompetitorsPage';

const sections = [
  {
    id: PANEL_LIST.wdc.bannedCompetitors,
    name: 'Banned Competitors',
    component: BannedCompetitorsPage,
  },
];

export default function Wdc() {
  return (
    <PanelTemplate heading="WDC Panel" sections={sections} />
  );
}
