import React, { useState } from 'react';
import { Accordion, Container, Message } from 'semantic-ui-react';
import UploadResultsJson from '../UploadResultsJson';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';

export default function Wrapper({
  competitionId,
  alreadyHasSubmittedResult,
  isAdminView,
}) {
  return (
    <WCAQueryClientProvider>
      <ImportResultsData
        competitionId={competitionId}
        alreadyHasSubmittedResult={alreadyHasSubmittedResult}
        isAdminView={isAdminView}
      />
    </WCAQueryClientProvider>
  );
}

function ImportResultsData({
  competitionId,
  alreadyHasSubmittedResult,
  isAdminView,
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
          <Message
            warning={alreadyHasSubmittedResult}
            info={!alreadyHasSubmittedResult}
          >
            {alreadyHasSubmittedResult
              ? 'Some results have already been uploaded before, importing results data again will override all of them!'
              : 'Please start by selecting a JSON file to import.'}
          </Message>
          <UploadResultsJson
            competitionId={competitionId}
            isAdminView={isAdminView}
          />
        </Accordion.Content>
      </Accordion>
    </Container>
  );
}
