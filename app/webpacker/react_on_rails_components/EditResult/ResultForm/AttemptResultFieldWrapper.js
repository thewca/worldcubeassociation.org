import React from 'react';

import AttemptResultField from '../WCALive/AttemptResultField/AttemptResultField';
import useNestedInputUpdater from '../../../lib/hooks/useNestedInputUpdater';

function AttemptResultFieldWrapper({
  index, setState, attempt, eventId,
}) {
  const setAttempt = useNestedInputUpdater(setState, `attempts[${index}]`);
  return (
    <AttemptResultField
      eventId={eventId}
      label={`Attempt ${index + 1}`}
      initialValue={attempt}
      value={attempt}
      onChange={setAttempt}
    />
  );
}

export default AttemptResultFieldWrapper;
