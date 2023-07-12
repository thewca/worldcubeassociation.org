import React, { useMemo } from 'react';
import FormContext from './State/FormContext';
import BasicInfo from './FormSections/BasicInfo';
import VenueInfo from './FormSections/VenueInfo';

export default function NewCompForm() {
  const [formData, setFormData] = React.useState({});

  const formContext = useMemo(() => ({
    formData,
    setFormData,
  }), [formData, setFormData]);

  return (
    <FormContext.Provider value={formContext}>
      <pre>
        <code>
          {JSON.stringify(formData, null, 2)}
        </code>
      </pre>
      <BasicInfo />
      <VenueInfo />
    </FormContext.Provider>
  );
}
