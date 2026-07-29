import React, { useState, useCallback } from 'react';

import { Button, Checkbox } from 'semantic-ui-react';

function DeleteScrambleButton({ deleteAction }) {
  const [confirmed, setConfirmed] = useState(false);
  const updater = useCallback(() => setConfirmed((prev) => !prev), [setConfirmed]);
  return (
    <div>
      <Button
        negative
        className="delete-scramble-button"
        disabled={!confirmed}
        onClick={deleteAction}
      >
        Delete the scramble
      </Button>
      <Checkbox
        label="Yes, I want to delete that scramble"
        checked={confirmed}
        onChange={updater}
      />
    </div>
  );
}

export default DeleteScrambleButton;
