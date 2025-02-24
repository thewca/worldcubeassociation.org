import React from 'react';
import { List } from 'semantic-ui-react';
import { competitionUrl } from '../../../../lib/requests/routes.js.erb';

export default function ActionItems({ actionItemList, messageArgs }) {
  return (
    <List bulleted>
      {actionItemList.map((actionItem) => (
        <List.Item>
          <ActionItemContent
            actionItem={actionItem}
            messageArgs={messageArgs}
          />
        </List.Item>
      ))}
    </List>
  );
}

function ActionItemContent({ actionItem, messageArgs }) {
  switch (actionItem) {
    case 'user_currently_banned':
      return 'This user is currently banned and cannot be anonymized.';
    case 'user_banned_in_past':
      return 'This person has been banned in the past, please email WIC and WRT to discuss whether to proceed with the anonymization.';
    case 'person_has_records_in_past':
      return `This person held ${messageArgs?.records?.world} World Records, ${messageArgs?.records?.continental} Contential Records, and ${messageArgs?.records?.national} National Records.`;
    case 'person_held_championship_podiums':
      return `This person has achieved World Championship podium ${messageArgs?.championshipPodiums?.world?.length} times, Continental Championship podium ${messageArgs?.championshipPodiums?.continental?.length} times, and National Championship podium ${messageArgs?.championshipPodiums?.national?.length} times.`;
    case 'person_competed_in_last_3_months':
      return (
        <>
          This person has competed in the last 3 months, please verify with the delegates
          that there is nothing outstanding regarding the competitor&apos;s involvement in
          these WCA competitions:
          <List ordered>
            {messageArgs?.recent_competitions_3_months?.map((competition) => (
              <List.Item key={competition.id}>
                <>
                  {'Contact '}
                  <a href={competitionUrl(competition.id)}>{competition.name}</a>
                  {' - '}
                  <a
                    href={`mailto:${competition.delegates.map((delegate) => delegate.email).join(',')}`}
                  >
                    {competition.delegates.map((delegate) => delegate.name).join(', ')}
                  </a>
                </>
              </List.Item>
            ))}
          </List>
        </>
      );
    case 'user_may_have_forum_account':
      return 'If you are an administrator of the WCA forum, search active users (https://forum.worldcubeassociation.org/admin/users/list/active) for any users using this email and anonymize their data. If you are not an administrator of the WCA forum, please ask a WRT member with administrator access to perform this step.';
    case 'user_has_active_oauth_access_grants':
      return (
        <>
          Request data removal from the following OAuth Access Grants:
          <List ordered>
            {messageArgs?.access_grants?.map((grant) => (
              <List.Item key={grant.id}>
                <>
                  {`${grant.application.name} - ${grant.application.redirect_uri} - `}
                  <a
                    href={`mailto:${grant.application.owner.email}`}
                  >
                    {grant.application.owner.name}
                  </a>
                </>
              </List.Item>
            ))}
          </List>
        </>
      );
    case 'competitions_with_external_website':
      return (
        <>
          Inspect external websites of competitions for data usage. If so, instruct the website
          to remove the person&apos;s data:
          <List ordered>
            {messageArgs?.competitions_with_external_website?.map((competition) => (
              <List.Item key={competition.id}>
                <>
                  <a href={competitionUrl(competition.id)}>{competition.name}</a>
                  {' - '}
                  <a href={competition.website}>{competition.website}</a>
                </>
              </List.Item>
            ))}
          </List>
        </>
      );
    case 'recent_competitions_data_to_be_removed_wca_live':
      return (
        <>
          This person has competed in the last 3 months. After anonymizing the person&apos;s data,
          synchronize the results on WCA Live (data more than 3 months old are automatically removed
          from WCA Live).
          <List ordered>
            {messageArgs?.recent_competitions_3_months?.map((competition) => (
              <List.Item key={competition.id}>
                <a href={competitionUrl(competition.id)}>{competition.name}</a>
              </List.Item>
            ))}
          </List>
        </>
      );
    default:
      return `Unknown data (${actionItem}), please contact WST.`;
  }
}
