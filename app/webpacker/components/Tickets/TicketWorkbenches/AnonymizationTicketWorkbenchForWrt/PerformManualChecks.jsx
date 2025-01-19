import React from 'react';
import { List, ListItem } from 'semantic-ui-react';

export default function PerformManualChecks() {
  // TODO: Add necessary links in this page.
  return (
    <List ordered>
      <ListItem>
        For recently competed competitions (Past 3 months), verify with the delegates that there
        is nothing outstanding regarding the competitor&apos;s involvement in these WCA
        competitions.
      </ListItem>
      <ListItem>
        If you are an administrator of the WCA forum, search active users
        (https://forum.worldcubeassociation.org/admin/users/list/active) for any users using this email
        and anonymize their data. If you are not an administrator of the WCA forum, please ask a WRT
        member with administrator access to perform this step.
      </ListItem>
      <ListItem>
        Request data removal from OAuth Access Grants.
      </ListItem>
      <ListItem>
        Inspect external websites of competitions for data usage. If so, instruct the website to
        remove the person&apos;s data.
      </ListItem>
      <ListItem>
        For recently competed competitions (Past 3 month), after anonymizing the person&apos;s data,
        synchronize the results on WCA Live (data more than 3 months old are automatically removed
        from WCA Live).
      </ListItem>
    </List>
  );
}
