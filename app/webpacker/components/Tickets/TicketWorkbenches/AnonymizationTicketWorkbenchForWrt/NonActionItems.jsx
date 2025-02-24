import React from 'react';
import { List } from 'semantic-ui-react';

export default function NonActionItems({ nonActionItemList, messageArgs }) {
  return (
    <List bulleted>
      {nonActionItemList.map((nonActionItem) => (
        <List.Item>
          <NonActionItemContent
            nonActionItem={nonActionItem}
            messageArgs={messageArgs}
          />
        </List.Item>
      ))}
    </List>
  );
}

function NonActionItemContent({ nonActionItem }) {
  switch (nonActionItem) {
    case 'user_currently_banned':
      return 'This user is currently not banned.';
    case 'user_banned_in_past':
      return "This person wasn't banned in the past.";
    case 'person_has_records_in_past':
      return 'This person has never held any records.';
    case 'person_held_championship_podiums':
      return 'This person has never been on the podium at the World, Continental, or National Championships.';
    case 'person_competed_in_last_3_months':
      return 'This person has not competed in the last 3 months, so no need to check with the Delegates on whether any outstanding is there.';
    case 'user_may_have_forum_account':
      return 'There is no user to check for a WCA forum account.';
    case 'user_has_active_oauth_access_grants':
      return 'This user has no active OAuth access grants.';
    case 'competitions_with_external_website':
      return 'There are no competitions with external websites.';
    case 'recent_competitions_data_to_be_removed_wca_live':
      return 'There are no recent competitions data to be removed from WCA Live.';
    default:
      return `Unknown data (${nonActionItem}), please contact WST.`;
  }
}
