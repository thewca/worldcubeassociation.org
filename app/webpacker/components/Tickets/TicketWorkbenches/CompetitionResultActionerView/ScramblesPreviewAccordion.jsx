import React, { Fragment, useState } from 'react';
import {
  Accordion, Container, Header, Message, Table,
} from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import ScrambleRowHeader from '../../../ResultsData/Scrambles/ScrambleRowHeader';
import ScrambleRowBody from '../../../ResultsData/Scrambles/ScrambleRowBody';

export default function ScramblesPreviewAccordion({ roundDetails, groupedScrambles }) {
  const [openItems, setOpenItems] = useState(
    roundDetails.map(({ roundId }) => roundId),
  );

  const toggleEvent = (roundId) => {
    setOpenItems((prev) => {
      if (prev.includes(roundId)) {
        return prev.filter((id) => id !== roundId);
      }
      return [...prev, roundId];
    });
  };

  if (roundDetails.length === 0) {
    return <Message warning>No scrambles uploaded to Inbox yet.</Message>;
  }

  return (
    <Container fluid>
      <Accordion style={{
        maxHeight: '500px',
        overflow: 'scroll',
      }}
      >
        {roundDetails.map(({ roundId, roundTypeId, eventId }) => (
          <Fragment id={roundId}>
            <Accordion.Title
              active={openItems.includes(roundId)}
              onClick={() => toggleEvent(roundId)}
            >
              <Header>
                {`${I18n.t(`events.${eventId}`)} ${I18n.t(`rounds.${roundTypeId}.name`)}`}
              </Header>
            </Accordion.Title>
            <Accordion.Content active={openItems.includes(roundId)}>
              <Table striped compact="very" singleLine>
                <Table.Header>
                  <ScrambleRowHeader />
                </Table.Header>
                <Table.Body>
                  <ScrambleRowBody round={{ scrambles: groupedScrambles[roundId] }} />
                </Table.Body>
              </Table>
            </Accordion.Content>
          </Fragment>
        ))}
      </Accordion>
    </Container>
  );
}
