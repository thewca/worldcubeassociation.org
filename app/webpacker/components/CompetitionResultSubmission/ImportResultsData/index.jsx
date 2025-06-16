import React, { useState } from 'react';
import { Accordion, Container, Message } from 'semantic-ui-react';
import UploadResultsJson from '../UploadResultsJson';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';

export default function Wrapper({
  competitionId,
  alreadyHasSubmittedResult,
  isWrtViewing,
}) {
  return (
    <WCAQueryClientProvider>
      <ImportResultsData
        competitionId={competitionId}
        alreadyHasSubmittedResult={alreadyHasSubmittedResult}
        isWrtViewing={isWrtViewing}
      />
    </WCAQueryClientProvider>
  );
}

function ImportResultsData({
  competitionId,
  alreadyHasSubmittedResult,
  isWrtViewing,
}) {
  const [activeAccordion, setActiveAccordion] = useState(!alreadyHasSubmittedResult);

  return (
    <Container fluid>
      <Accordion fluid styled>
        <Accordion.Title
          active={activeAccordion}
          onClick={() => setActiveAccordion((prevValue) => !prevValue)}
        >
          Import Results Data
        </Accordion.Title>
        <Accordion.Content active={activeAccordion}>
          {alreadyHasSubmittedResult
            ? (
              <Message warning>
                Some results are already there, importing results data again will override all
                of them!
              </Message>
            )
            : (
              <Message info>
                Please start by selecting a JSON file to import.
              </Message>
            )}
          <UploadResultsJson
            competitionId={competitionId}
            isWrtViewing={isWrtViewing}
          />
        </Accordion.Content>
      </Accordion>
    </Container>
  );
}
