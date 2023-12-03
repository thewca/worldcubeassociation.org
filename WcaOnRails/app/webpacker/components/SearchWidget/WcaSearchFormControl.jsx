import React from 'react';
import WcaSearch from './WcaSearch';

export default function WcaSearchFormControl({
  name, value, onChange, model, multiple = true, params = {},
}) {
  const setValue = (setValueFn) => {
    const newValue = setValueFn();
    onChange(null, { name, value: newValue });
  };

  return (
    <WcaSearch
      selectedValue={value}
      setSelectedValue={setValue}
      multiple={multiple}
      model={model}
      params={params}
    />
  );
}
