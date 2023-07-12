import React, { useContext, useMemo } from 'react';
import FormContext from '../State/FormContext';

export default function SubSection({ section, children }) {
  const { formData, setFormData } = useContext(FormContext);

  const nestedFormData = formData[section] || {};
  const nestedSetFormData = (getData) => {
    setFormData((prevData) => {
      const newData = { ...prevData };
      newData[section] = getData(newData[section] || {});
      return newData;
    });
  };

  const value = useMemo(() => ({
    formData: nestedFormData,
    setFormData: nestedSetFormData,
  }), [nestedFormData, nestedSetFormData]);

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}
