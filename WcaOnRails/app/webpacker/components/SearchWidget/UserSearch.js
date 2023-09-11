import React from 'react';

import OmnisearchInput from './OmnisearchInput';
import { userSearchApiUrl } from '../../lib/requests/routes.js.erb';

function UserSearch({ onSelect }) {
  return (
    <OmnisearchInput
      removeNoResultsMessage={false}
      goToItemOnSelect={false}
      url={userSearchApiUrl}
      onSelect={onSelect}
      multiple={false}
    />
  );
}

export default UserSearch;
