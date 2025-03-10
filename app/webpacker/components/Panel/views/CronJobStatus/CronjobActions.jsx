import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Button } from 'semantic-ui-react';
import runCronjob from './api/runCronjob';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import resetCronjob from './api/resetCronjob';
import { useConfirm } from '../../../../lib/providers/ConfirmProvider';

export default function CronjobActions({ cronjobName, cronjobDetails }) {
  const isResetDisabled = !(cronjobDetails?.in_progress && cronjobDetails?.recently_errored);
  const isDoItDisabled = (
    cronjobDetails?.reason_not_to_run || cronjobDetails?.scheduled || cronjobDetails?.in_progress
  );

  const [showDebugInfo, setShowDebugInfo] = useState();
  const confirm = useConfirm();

  const queryClient = useQueryClient();
  const {
    mutate: runCronjobMutation,
    isLoading: isRunLoading,
    isError: isRunError,
    error: runError,
  } = useMutation({
    mutationFn: runCronjob,
    onSuccess: (updatedCronjobDetails) => queryClient.setQueryData(
      ['cronjob-details', cronjobName],
      updatedCronjobDetails,
    ),
  });
  const {
    mutate: resetCronjobMutation,
    isLoading: isResetLoading,
    isError: isResetError,
    error: resetError,
  } = useMutation({
    mutationFn: resetCronjob,
  });

  const resetCronjobConfirmation = () => {
    confirm({
      content: 'Are you sure that you want to proceed with reset? Usually this needs to be done if you know that source of the error has been fixed. If you push this button without consulting WST, you risk incurring their wrath!',
    }).then(() => resetCronjobMutation({ cronjobName }));
  };

  if (isRunLoading || isResetLoading) return <Loading />;
  if (isRunError || isResetError) return <Errored error={runError || resetError} />;

  return (
    <>
      <Button
        disabled={isResetDisabled}
        onClick={resetCronjobConfirmation}
      >
        Reset
      </Button>
      <Button
        disabled={isDoItDisabled}
        onClick={() => runCronjobMutation({ cronjobName })}
      >
        Do it!
      </Button>
      <Button
        toggle
        active={showDebugInfo}
        onClick={() => setShowDebugInfo(!showDebugInfo)}
      >
        Show Debug info for WST
      </Button>
      {showDebugInfo && (
        <pre>
          {JSON.stringify(cronjobDetails, null, 2)}
        </pre>
      )}
    </>
  );
}
