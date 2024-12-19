import React from 'react';
import { Icon, TabPane } from 'semantic-ui-react';
import Markdown from '../Markdown';
import { editCompetitionTabUrl } from '../../lib/requests/routes.js.erb';

export default function CompetitionTab({ tab, canManage, competition }) {
  return (
    <TabPane>
      <Markdown md={tab.content} id={tab.id} />
      { canManage && (
      <a href={editCompetitionTabUrl(competition.id, tab.id)}>
        <Icon name="edit" />
        Edit
      </a>
      )}
    </TabPane>
  );
}
