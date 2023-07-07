import React from 'react';

import { List } from 'semantic-ui-react';

/**
 * Hard-code the disclaimer in English for legal reasons, so don't
 * handle as part of the usual localization / i18n process.
 * @returns {JSX.Element}
 * @constructor
 */
function Disclaimer() {
  return (
    <div className="container">
      <h1>Disclaimer</h1>
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
    </div>
  );
}

export default Disclaimer;
