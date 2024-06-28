import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';

export default function Wec() {
  return (
    <PanelTemplate
      heading="WEC Panel"
      pages={[
        PANEL_PAGES.bannedCompetitors,
        PANEL_PAGES.downloadVoters,
      ]}
    />
  );
}
