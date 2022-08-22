import React from 'react';

import { List } from 'semantic-ui-react';

function Disclaimer() {
  return (
    <List as="ul">
      <List.Item as="li">
        The World Cube Association (WCA) works to verify that appropriate WCA Regulations are
        followed for the competition portion of WCA Competitions.
      </List.Item>
      <List.Item as="li">
        However, all other aspects of competitions, including (but not limited to) financial
        matters and competition websites, are solely the responsibility of the competition
        organizers and not the WCA.
      </List.Item>
      <List.Item as="li">
        Unless otherwise noted, sponsorship and partnership agreements are arranged with
        individual competition organizers and not with the WCA.
      </List.Item>
      <List.Item as="li">
        Since the WCA itself does not organize competitions, the WCA is not responsible for
        damage or injury incurred at WCA Competitions.
      </List.Item>
      <List.Item as="li">
        It is not permitted to use the WCA&apos;s non-profit status determination letter
        without explicit permission from the WCA Board of Directors.
      </List.Item>
    </List>
  );
}

export default Disclaimer;
