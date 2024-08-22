import React, { useState, useCallback } from 'react';

import { Button, Checkbox } from 'semantic-ui-react';

function DeleteResultButton({ deleteAction }) {
  const [confirmed, setConfirmed] = useState(false);
  const updater = useCallback(() => setConfirmed((prev) => !prev), [setConfirmed]);
  return (
    <div>
      <Button
        negative
        className="delete-result-button"
        disabled={!confirmed}
        onClick={deleteAction}
      >
        Delete the result
      </Button>
      <Checkbox
        label="Yes, I want to delete that result"
        checked={confirmed}
        onChange={updater}
      />
    </div>
  );
}

export default DeleteResultButton;
