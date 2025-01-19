import React from 'react';
import { Message } from 'semantic-ui-react';
import _ from 'lodash';

export default function ReviewSystemGeneratedChecks({ data }) {
  const isCurrentlyBanned = data.user_details?.is_currently_banned;
  const isBannedInPast = data.user_details?.banned_in_past;
  const recordCount = data.person_details?.record_count;
  const championshipPodiums = data.person_details?.championship_podiums;
  const heldRecords = recordCount?.total > 0;
  const heldChampionshipPodiums = championshipPodiums && _.some([
    championshipPodiums.world,
    championshipPodiums.continental,
    championshipPodiums.national,
  ], (arr) => arr.length > 0);

  return (
    <>
      {data.user_details && (
        <>
          <b>User checks</b>
          {isCurrentlyBanned ? (
            <Message error>This person is currently banned and cannot be anonymized.</Message>
          ) : (
            <Message positive>This person is currently not banned.</Message>
          )}
          {isBannedInPast ? (
            <Message error>
              This person has been banned in the past, please email WIC and WRT to discuss
              whether to proceed with the anonymization.
            </Message>
          ) : (
            <Message positive>This person wasn&apos;t banned in the past.</Message>
          )}
        </>
      )}
      {data.person_details && (
        <>
          <b>Person checks</b>
          {heldRecords ? (
            <Message error>
              {`This person held ${recordCount.world} World Records, ${recordCount.continental} Contential Records, and ${recordCount.national} National Records.`}
            </Message>
          ) : (
            <Message positive>This person has never held any records.</Message>
          )}
          {heldChampionshipPodiums ? (
            <Message error>
              {`This person has achieved World Championship podium ${championshipPodiums.world.length} times, Continental Championship podium ${championshipPodiums.continental.length} times, and National Championship podium ${championshipPodiums.national.length} times.`}
            </Message>
          ) : (
            <Message positive>
              This person has never been on the podium at the World, Continental,
              or National Championships.
            </Message>
          )}
        </>
      )}
    </>
  );
}
