import React from 'react';
import { Button } from 'semantic-ui-react';
import { eligibleVotersUrl, leaderSeniorVotersUrl, regionalVotersUrl } from '../../../../lib/requests/routes.js.erb';

export default function DownloadVoters() {
  return (
    <>
      <Button href={eligibleVotersUrl}>WCA all voting members</Button>
      <Button href={leaderSeniorVotersUrl}>WCA leaders and seniors</Button>
      <Button href={regionalVotersUrl}>WCA regionals</Button>
    </>
  );
}
