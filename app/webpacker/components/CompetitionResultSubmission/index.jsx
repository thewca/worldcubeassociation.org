import React, { useCallback, useMemo, useState } from 'react';
import { Accordion, List, Message } from 'semantic-ui-react';
import { useQueryClient } from '@tanstack/react-query';
import ImportResultsData from './ImportResultsData';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import FormToWrt, { IMPORT_STEP_ICON, IMPORT_STEP_TITLE } from './FormToWrt';

export default function Wrapper({
  competitionId,
  resultsSubmitted,
  hasTemporaryResults,
  uploadedScrambleFilesCount,
  canSubmitResults,
  scoretakingSoftware,
}) {
  return (
    <WCAQueryClientProvider>
      <CompetitionResultSubmission
        competitionId={competitionId}
        resultsSubmitted={resultsSubmitted}
        hasTemporaryResults={hasTemporaryResults}
        uploadedScrambleFilesCount={uploadedScrambleFilesCount}
        canSubmitResults={canSubmitResults}
        scoretakingSoftware={scoretakingSoftware}
      />
    </WCAQueryClientProvider>
  );
}

function CompetitionResultSubmission({
  competitionId,
  resultsSubmitted,
  hasTemporaryResults: hasTemporaryResultsInitial,
  uploadedScrambleFilesCount,
  canSubmitResults,
  scoretakingSoftware,
}) {
  const [hasTemporaryResults, setHasTemporaryResults] = useState(hasTemporaryResultsInitial);
  const [accordionIndex, setAccordionIndex] = useState(hasTemporaryResultsInitial ? 1 : 0);

  const queryClient = useQueryClient();

  const onImportSuccess = useCallback(() => {
    // the string descriptor is enough for invalidation, the query library supports prefix matching
    queryClient.invalidateQueries({ queryKey: ['competition-validation-output'] });

    setHasTemporaryResults(true);
    setAccordionIndex(1);
  }, [queryClient, setHasTemporaryResults, setAccordionIndex]);

  const accordionPanels = useMemo(() => [
    {
      key: 'import-results',
      title: {
        icon: IMPORT_STEP_ICON,
        content: IMPORT_STEP_TITLE,
      },
      content: {
        content: (
          <ImportResultsData
            competitionId={competitionId}
            uploadedScrambleFilesCount={uploadedScrambleFilesCount}
            onImportSuccess={onImportSuccess}
            hasTemporaryResults={hasTemporaryResults}
            scoretakingSoftware={scoretakingSoftware}
          />
        ),
      },
    },
    {
      key: 'form-to-wrt',
      title: {
        icon: 'mail',
        content: 'Submit to WRT',
      },
      content: {
        content: (
          <FormToWrt
            competitionId={competitionId}
            hasTemporaryResults={hasTemporaryResults}
            canSubmitResults={canSubmitResults}
            onClickImportStep={() => setAccordionIndex(0)}
          />
        ),
      },
    },
  ], [
    competitionId,
    uploadedScrambleFilesCount,
    onImportSuccess,
    hasTemporaryResults,
    scoretakingSoftware,
    canSubmitResults,
  ]);

  if (resultsSubmitted) {
    return (
      <Message positive>
        The results have already been submitted. If you have any more questions or
        comments please reply to the email sent with the first results submission.
      </Message>
    );
  }

  return (
    <>
      The result submission process has two steps:
      <List ordered>
        <List.Item>
          Providing valid results data to the website.
          This can be done in one of the following ways:
          <List.List>
            {scoretakingSoftware !== 'external' && (
              <List.Item value="a">Importing results directly from Live Results</List.Item>
            )}
            {scoretakingSoftware !== 'internal' && (
              <List.Item value="a">Uploading a Results JSON file</List.Item>
            )}
          </List.List>
        </List.Item>
        <List.Item>
          Submit these results to the WRT after addressing warnings (if any).
        </List.Item>
      </List>
      <Accordion
        styled
        fluid
        panels={accordionPanels}
        activeIndex={accordionIndex}
        onTitleClick={(e, props) => setAccordionIndex(props.index)}
      />
    </>
  );
}
