import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';

export default function Board() {
  return (
    <PanelTemplate
      heading="Board Panel"
      pages={[
        PANEL_PAGES.seniorDelegatesList,
        PANEL_PAGES.leadersAdmin,
        PANEL_PAGES.regionsManager,
        PANEL_PAGES.delegateProbations,
        PANEL_PAGES.groupsManagerAdmin,
        PANEL_PAGES.boardEditor,
        PANEL_PAGES.officersEditor,
        PANEL_PAGES.regionsAdmin,
        PANEL_PAGES.bannedCompetitors,
      ]}
    />
  );
}
