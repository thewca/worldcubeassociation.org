import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';

export default function Weat() {
  return (
    <PanelTemplate
      heading="WEAT Panel"
      pages={[
        PANEL_PAGES.bannedCompetitors,
      ]}
    />
  );
}
