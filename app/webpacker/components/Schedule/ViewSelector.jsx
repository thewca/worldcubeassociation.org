import React from 'react';
import { Menu } from 'semantic-ui-react';

const views = ['calendar', 'table'];

export default function ViewSelector({ activeView, setActiveView }) {
  return (
    <Menu pointing secondary fluid widths={2}>
      {views.map((view) => (
        <Menu.Item
          key={view}
          name={view}
          active={activeView === view}
          onClick={() => setActiveView(view)}
        />
      ))}
    </Menu>
  );
}
