import React from 'react';
import PanelTemplate from './PanelTemplate';
import { PANEL_PAGES } from '../../lib/wca-data.js.erb';

export default function Leader({ loggedInUserId }) {
  return (
    <PanelTemplate
      heading="Leader Panel"
      pages={[
        PANEL_PAGES.leaderForms,
        PANEL_PAGES.groupsManager,
      ]}
      loggedInUserId={loggedInUserId}
    />
  );
}
