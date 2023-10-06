import React, { useCallback, useMemo } from 'react';
import { useStore } from '../../../lib/providers/StoreProvider';

export default function SubSection({ section, children }) {
  const { competition } = useStore();

  const nestedFormData = competition[section] || {};

  const nestedSetFormData = useCallback((getData) => {
    setFormData((prevData) => {
      const newData = { ...prevData };
      newData[section] = getData(newData[section] || {});
      return newData;
    });
  }, [section]);

  const value = useMemo(() => ({
    formData: nestedFormData,
    setFormData: nestedSetFormData,
  }), [nestedFormData, nestedSetFormData]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}
