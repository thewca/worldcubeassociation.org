import React, { createContext, useCallback, useContext } from 'react';
import { updateFormValue } from './store/actions';
import { useFormObject } from './EditForm';

const SectionContext = createContext();

export default function SectionProvider({ children, section = [] }) {
  return (
    <SectionContext.Provider value={section}>
      {children}
    </SectionContext.Provider>
  );
}

export const useSections = () => useContext(SectionContext);

const headAndTail = (arr) => {
  const safetyClone = [...arr];
  const shiftedHead = safetyClone.shift();

  return [shiftedHead, safetyClone];
};

export const readValueRecursive = (formValues, sectionKeys = []) => {
  if (sectionKeys.length === 0) {
    return formValues;
  }

  const [nextSection, tail] = headAndTail(sectionKeys);
  const nestedFormValues = formValues?.[nextSection] || {};

  return readValueRecursive(nestedFormValues, tail);
};

export const useFormObjectSection = () => {
  const formObject = useFormObject();
  const sections = useSections();

  return readValueRecursive(formObject, sections);
};

export const useUpdateFormAction = () => {
  const sections = useSections();

  return useCallback((key, value) => updateFormValue(key, value, sections), [sections]);
};
