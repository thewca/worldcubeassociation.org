import React from 'react';

import OmnisearchInput from './OmnisearchInput';
import { userSearchApiUrl } from '../../lib/requests/routes.js.erb';

function UserSearch({ onSelect }) {
  return (
    <div style={{
      width: '200px',
    }}
    >
      <OmnisearchInput
        removeNoResultsMessage={false}
        goToItemOnSelect={false}
        url={userSearchApiUrl}
        onSelect={onSelect}
        multiple={false}
      />
    </div>
  );
}

export default UserSearch;
