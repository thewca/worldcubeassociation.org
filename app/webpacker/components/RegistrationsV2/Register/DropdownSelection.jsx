import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';

export default function DropdownSelection({
  competitionInfo,
  value,
  onChange,
}) {
  const [hasInteracted, setHasInteracted] = useState(false);

  // Handle cases where the competition doesn't have the dropdown fields yet
  if (!competitionInfo || !competitionInfo.registration_dropdown_enabled) {
    return null;
  }

  const options = competitionInfo.registration_dropdown_options
    ? competitionInfo.registration_dropdown_options.split('\n').filter(option => option.trim())
    : [];

  // If there are no options, don't show the dropdown
  if (options.length === 0) {
    return null;
  }

  const dropdownOptions = options.map(option => ({
    key: option,
    text: option,
    value: option,
  }));

  const handleChange = (e, { value }) => {
    setHasInteracted(true);
    onChange(value);
  };

  const isRequired = competitionInfo.registration_dropdown_required;
  const hasError = isRequired && hasInteracted && !value;

  return (
    <Form.Field required={isRequired} error={hasError}>
      <label htmlFor="dropdown-selection">
        {I18n.t('competitions.registration_v2.register.dropdown_selection')}
      </label>
      <Form.Select
        id="dropdown-selection"
        options={dropdownOptions}
        value={value}
        onChange={handleChange}
        placeholder={I18n.t('competitions.registration_v2.register.dropdown_placeholder')}
        error={hasError && I18n.t('competitions.registration_v2.register.dropdown_required')}
      />
    </Form.Field>
  );
}
