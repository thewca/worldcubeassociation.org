import React from 'react';

import RoleForm from './RoleForm';

function DelegateTab({ delegateDetails, regionList, disabled }) {
  return (
    <RoleForm
      values={delegateDetails}
      regionList={regionList}
      disabled={disabled}
    />
  );
}

export default DelegateTab;
