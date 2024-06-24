import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';

export default function Admin() {
  return (
    <PanelTemplate
      heading="Admin Panel"
      pages={Object.values(PANEL_PAGES)}
    />
  );
}
