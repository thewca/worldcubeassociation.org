import React from 'react';
import { Button } from 'semantic-ui-react';
import { eligibleVotersUrl, leaderSeniorVotersUrl } from '../../../../lib/requests/routes.js.erb';

export default function DownloadVoters() {
  return (
    <>
      <Button href={eligibleVotersUrl}>WCA all voting members</Button>
      <Button href={leaderSeniorVotersUrl}>WCA leaders and seniors</Button>
    </>
  );
}
