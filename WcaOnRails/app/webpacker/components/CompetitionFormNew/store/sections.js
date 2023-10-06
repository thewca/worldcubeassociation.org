import React, { createContext, useCallback, useContext } from 'react';
import { useStore } from '../../../lib/providers/StoreProvider';
import { updateFormValue } from './actions';

const SectionContext = createContext();

export default function SectionProvider({ children, section = [] }) {
  return (
    <SectionContext.Provider value={section}>
      {children}
    </SectionContext.Provider>
  );
}

export const useSections = () => useContext(SectionContext);

const readValueRecursive = (formValues, sectionKeys = []) => {
  if (sectionKeys.length === 0) {
    return formValues;
  }

  const nextSection = sectionKeys.shift();
  const nestedFormValues = formValues[nextSection] || {};

  return readValueRecursive(nestedFormValues, sectionKeys);
};

export const useCompetitionForm = () => {
  const { competition } = useStore();
  const sections = useSections();

  // doing shallow copy on purpose to make sure we're not accidentally mutating state on recursion
  const sectionKeys = [...sections];

  return readValueRecursive(competition, sectionKeys);
};

export const useUpdateFormAction = () => {
  const sections = useSections();

  return useCallback((key, value) => updateFormValue(key, value, sections), [sections]);
};
