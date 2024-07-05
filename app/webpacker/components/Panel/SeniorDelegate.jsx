import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';

export default function SeniorDelegate() {
  return (
    <PanelTemplate
      heading="Senior Delegate Panel"
      pages={[
        PANEL_PAGES.delegateForms,
        PANEL_PAGES.regions,
        PANEL_PAGES.delegateProbations,
        PANEL_PAGES.subordinateDelegateClaims,
        PANEL_PAGES.subordinateUpcomingCompetitions,
      ]}
    />
  );
}
