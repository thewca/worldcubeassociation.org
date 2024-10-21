import React, { useState } from 'react';
import { Message } from 'semantic-ui-react';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import useInputState from '../../../../lib/hooks/useInputState';
import AnonymizeUser from './AnonymizeUser';

export default function AnonymizationScriptPage() {
  const [userId, setUserId] = useInputState();
  const [success, setSuccess] = useState();

  if (success) {
    return <Message positive>Anonymization successful.</Message>;
  }

  return userId
    ? (
      <AnonymizeUser
        userId={userId}
        onSuccess={() => setSuccess(true)}
      />
    )
    : (
      <IdWcaSearch
        label="Enter the user to ban"
        model={SEARCH_MODELS.user}
        multiple={false}
        value={userId}
        onChange={setUserId}
      />
    );
}
