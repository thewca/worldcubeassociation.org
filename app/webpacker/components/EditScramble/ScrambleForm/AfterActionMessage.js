import React from 'react';
import { Message, List } from 'semantic-ui-react';

import {
  adminCheckExistingResultsUrl,
  competitionAllResultsUrl,
  competitionUrl,
} from '../../../lib/requests/routes.js.erb';

function AfterActionMessage({
  eventId,
  competitionId,
  response,
}) {
  return (
    <>
      <Message
        positive
        header={(
          <>
            Action performed for:
            {' '}
            <a href={competitionUrl(competitionId)} target="_blank" rel="noreferrer">{competitionId}</a>
          </>
        )}
        list={response.messages}
      />
      <Message positive>
        <div>
          Please make sure to:
          <List ordered>
            <List.Item>
              <a
                href={adminCheckExistingResultsUrl(competitionId)}
                target="_blank"
                rel="noreferrer"
              >
                Check Competition Validators
              </a>
            </List.Item>
          </List>
          You can also
          {' '}
          <a href={competitionAllResultsUrl(competitionId, eventId)}>go back to the results</a>
          .
        </div>
      </Message>
    </>
  );
}

export default AfterActionMessage;
