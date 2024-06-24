import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';

export default function Wdc() {
  return (
    <PanelTemplate
      heading="WDC Panel"
      pages={[
        PANEL_PAGES.bannedCompetitors,
      ]}
    />
  );
}
