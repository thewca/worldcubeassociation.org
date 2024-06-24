import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';

export default function Wst() {
  return (
    <PanelTemplate
      heading="WST Panel"
      pages={[
        PANEL_PAGES.translators,
      ]}
    />
  );
}
