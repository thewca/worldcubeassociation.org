import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Button } from 'semantic-ui-react';
import runCronjob from './api/runCronjob';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import resetCronjob from './api/resetCronjob';
import { useConfirm } from '../../../../lib/providers/ConfirmProvider';
import useToggleButtonState from '../../../../lib/hooks/useToggleButtonState';

export default function CronjobActions({ cronjobName, cronjobDetails }) {
  const [showDebugInfo, setShowDebugInfo] = useToggleButtonState(false);

  // Usually, we want to reset if we can clearly establish that
  //   the cronjob halted because of an error (i.e. it halted AND an error state was recorded)
  const terminatedAndErrored = !cronjobDetails?.in_progress && cronjobDetails?.recently_errored;
  // However, due to deployment chokes, we manually override the button to be enabled
  //   when the debug information is shown (there is still an extra confirmation warning)
  const isResetDisabled = !(terminatedAndErrored || showDebugInfo);

  const isDoItDisabled = (
    cronjobDetails?.reason_not_to_run || cronjobDetails?.scheduled || cronjobDetails?.in_progress
  );

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
    // Did you reach here just by opening the debug panel, withOUT the cronjob actually erroring?
    const isWstOverride = showDebugInfo && !terminatedAndErrored;

    const confirmationMessage = isWstOverride
      ? 'BEEP BOOP! Danger territory ahead! You are about to reset a cronjob without an actual error state. This should only ever be done in extraordinary circumstances (deployment chokes) and IS VERY DANGEROUS unless you absolutely know what you\'re doing!'
      : 'Are you sure that you want to proceed with reset? Usually this needs to be done if you know that the source of the error has been fixed. If you push this button without consulting WST, you risk incurring their wrath!';

    confirm({
      content: confirmationMessage,
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
        onClick={setShowDebugInfo}
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
