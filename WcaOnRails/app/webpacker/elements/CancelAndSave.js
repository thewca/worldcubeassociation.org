import React from "react";

import { Icon } from "semantic-ui-react";

// Place this component inside a form element. The button with type="submit" will trigger the form submission.

export const CancelAndSave = ({ saveDisabed, cancelDisabled, onCancel }) => {
  return (
    <div>
      <button
        className="btn btn-primary pull-right"
        type="submit"
        disabled={!!saveDisabed}
      >
        <Icon name="save" />
      </button>
      <button
        className="btn btn-warning pull-right"
        type="button"
        onClick={onCancel}
        disabled={!!cancelDisabled}
      >
        <Icon name="cancel" />
      </button>
    </div>
  );
};
