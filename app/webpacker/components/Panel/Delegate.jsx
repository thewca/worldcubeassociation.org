import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';

export default function Delegate() {
  return (
    <PanelTemplate
      heading="Delegate Panel"
      pages={[
        PANEL_PAGES.importantLinks,
        PANEL_PAGES.delegateHandbook,
        PANEL_PAGES.bannedCompetitors,
      ]}
    />
  );
}
