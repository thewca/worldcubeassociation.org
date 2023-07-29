import React from 'react';

import { Form } from 'semantic-ui-react';

import delegateStatus from '../../lib/helpers/delegate-status';
import I18n from '../../lib/i18n';
import { delegateUpdateDelegateUrl } from '../../lib/requests/routes.js.erb';
import useSaveAction from '../../lib/hooks/useSaveAction';
import Errored from '../Requests/Errored';

const notDelegateOption = 'None';

const delegateStatusOptions = [{
  key: notDelegateOption,
  text: notDelegateOption,
  value: notDelegateOption,
},
...Object.keys(delegateStatus)
  .map((status) => ({
    key: status,
    text: delegateStatus[status].name,
    value: status,
  }))];

function RoleForm({
  values,
  regionList,
  disabled,
}) {
  const { userId, ...delegateDetails } = values;
  const [savedValues, setSavedValues] = React.useState(values.status ? delegateDetails : {});
  const [formValues, setFormValues] = React.useState(values.status ? delegateDetails : {});
  const [error, setError] = React.useState(false);
  const { save, saving } = useSaveAction();
  const buttonDisabled = (disabled
  || saving
  || JSON.stringify(formValues) === JSON.stringify(savedValues));

  const saveAction = () => {
    setError(false);
    save(
      delegateUpdateDelegateUrl,
      formValues.status ? {
        userId,
        status: formValues.status,
        location: formValues.location,
        regionId: formValues.regionId,
      } : { userId },
      () => setSavedValues(formValues),
      { method: 'POST' },
      () => setError(true),
    );
  };

  return (
    <Form
      onSubmit={saveAction}
      loading={saving}
    >
      {!!error && <Errored />}
      <Form.Dropdown
        label={I18n.t('activerecord.attributes.user.delegate_status')}
        fluid
        selection
        value={formValues.status || notDelegateOption}
        disabled={disabled}
        options={delegateStatusOptions}
        onChange={(_, { value }) => {
          if (value === notDelegateOption) {
            setFormValues({});
          } else {
            setFormValues({ ...formValues, status: value });
          }
        }}
      />
      {formValues.status && !delegateStatus[formValues.status].isLeadRole && (
        <Form.Input
          label={I18n.t('activerecord.attributes.user.location')}
          value={formValues.location || ''}
          disabled={disabled}
          onChange={(_, { value }) => setFormValues({ ...formValues, location: value })}
        />
      )}
      {/* TODO: Add country field too after introduction of delegates table */}
      {formValues.status && (
        <Form.Dropdown
          label={I18n.t('activerecord.attributes.user.region')}
          placeholder="Select Region"
          fluid
          selection
          value={formValues.regionId}
          disabled={disabled || formValues.status === 'None'}
          options={regionList.map((region) => ({
            key: region.id,
            text: region.name,
            value: region.id,
          }))}
          onChange={(_, { value }) => setFormValues({ ...formValues, regionId: value })}
        />
      )}
      <div style={{
        display: 'flex',
      }}
      >
        <Form.Button
          primary
          type="submit"
          disabled={buttonDisabled}
        >
          Update
        </Form.Button>
        <Form.Button
          secondary
          onClick={() => setFormValues(savedValues)}
          type="reset"
          disabled={buttonDisabled}
        >
          Cancel
        </Form.Button>
      </div>
    </Form>
  );
}

export default RoleForm;
