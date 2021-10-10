import React from 'react';
import {
  Icon,
} from 'semantic-ui-react';

import { registerComponent } from '../wca/react-utils';

const DeleteRegistration = () => (
  <div>
    <button type="submit" color="red" className="btn btn-danger selected-pending-approved-registrations-actions" value="delete-selected" name="registrations_action">
      <Icon name="trash" />
      Delete
    </button>
  </div>
);

registerComponent(DeleteRegistration, 'DeleteRegistration');
