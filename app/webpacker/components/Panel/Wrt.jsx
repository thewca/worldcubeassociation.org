import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';

export default function Wrt() {
  return (
    <PanelTemplate
      heading="WRT Panel"
      pages={[
        PANEL_PAGES.postingDashboard,
        PANEL_PAGES.editPerson,
      ]}
    />
  );
}
