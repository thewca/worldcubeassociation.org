import React from 'react';
import { Checkbox } from 'semantic-ui-react';
import { IdWcaSearch } from './WcaSearch';
import SEARCH_MODELS from './SearchModel';
import useCheckboxState from '../../lib/hooks/useCheckboxState';

function AdminWcaSearch({
  value, onChange, model, label, multiple,
}) {
  const [emailSearchEnabled, setEmailSearchEnabled] = useCheckboxState(false);

  return (
    <>
      <IdWcaSearch
        value={value}
        onChange={onChange}
        model={model}
        label={label}
        multiple={multiple}
        params={{
          adminSearch: true,
          email: emailSearchEnabled,
        }}
      />
      {model === SEARCH_MODELS.user && (
        <>
          <Checkbox
            label="Enable email search"
            value={emailSearchEnabled}
            onChange={setEmailSearchEnabled}
          />
          <p>
            Note: When email search is enabled, you can search only with email, and you are
            expected to enter the full email address.
          </p>
        </>
      )}
    </>
  );
}

export default AdminWcaSearch;
