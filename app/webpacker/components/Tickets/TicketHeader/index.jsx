import React from 'react';
import { Card, Header } from 'semantic-ui-react';
import _ from 'lodash';
import StatusView from './StatusView';
import { ticketTypes } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';
import { personUrl, competitionUrl } from '../../../lib/requests/routes.js.erb';

// let i18n-tasks know the key is used
// i18n-tasks-use t('tickets.type.edit_person')
// i18n-tasks-use t('tickets.type.competition_result')

export default function TicketHeader({ ticketDetails, currentStakeholder, updateStatus }) {
  const { ticket: { id, metadata_type: ticketType } } = ticketDetails;

  return (
    <Card fluid>
      <Card.Content>
        <Header as="h1">
          {`Ticket #${id}: ${I18n.t(`tickets.type.${
            _.findKey(ticketTypes, (ticketTypeParam) => ticketTypeParam === ticketType)
          }`)}`}
        </Header>
        <Header as="h3">
          <SubHeading ticketDetails={ticketDetails} />
        </Header>
        <StatusView
          ticketDetails={ticketDetails}
          currentStakeholder={currentStakeholder}
          updateStatus={updateStatus}
        />
      </Card.Content>
    </Card>
  );
}

function SubHeading({ ticketDetails }) {
  const { ticket: { metadata_type: ticketType, metadata } } = ticketDetails;

  switch (ticketType) {
    case ticketTypes.edit_person:
      return (
        <>
          WCA ID:
          {' '}
          <a
            href={personUrl(metadata.wca_id)}
            target="_blank"
            rel="noreferrer"
          >
            {metadata.wca_id}
          </a>
        </>
      );
    case ticketTypes.competition_result:
      return (
        <>
          Competition name:
          {' '}
          <a
            href={competitionUrl(metadata.competition.id)}
            target="_blank"
            rel="noreferrer"
          >
            {metadata.competition.name}
          </a>
        </>
      );
    default:
      return 'Unknown Ticket';
  }
}
