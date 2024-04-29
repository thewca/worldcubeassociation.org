import React from 'react';
import { Menu } from 'semantic-ui-react';
import i18n from '../../lib/i18n';

const views = ['calendar', 'table'];

export default function ViewSelector({ activeView, setActiveView }) {
  return (
    <Menu pointing secondary fluid widths={2}>
      {views.map((view) => (
        <Menu.Item
          key={view}
          name={i18n.t(`competitions.schedule.display_as.${view}`)}
          active={activeView === view}
          onClick={() => setActiveView(view)}
        />
      ))}
    </Menu>
  );
}
