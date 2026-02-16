import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import _ from 'lodash';
import { changesSaved, setErrors, updateFormValue } from '../store/actions';
import formReducer from '../store/reducer';
import SectionProvider, { readValueRecursive, useSections } from './FormSectionProvider';

const FormContext = createContext(null);

const createState = (initialObject) => ({
  object: initialObject,
  initialObject,
  errors: null,
});

export default function FormObjectProvider({
  children,
  initialObject,
  globalDisabled = false,
  globalAllowIgnoreDisabled = true,
}) {
  const [formState, dispatch] = useReducer(formReducer, initialObject, createState);

  const unsavedChanges = useMemo(() => (
    !_.isEqual(formState.object, formState.initialObject)
  ), [formState.object, formState.initialObject]);

  const onSuccess = useCallback((override = undefined, writeWorkingState = false) => {
    dispatch(changesSaved(override, writeWorkingState));
    dispatch(setErrors(null));
  }, [dispatch]);

  const onError = useCallback((err) => {
    // check whether the 'json' and 'response' properties are set,
    // which means it's (very probably) a FetchJsonError
    if (err.json !== undefined && err.response !== undefined) {
      // The 'error' property means we pasted a generic error message in the backend.
      if (err.json.error !== undefined) {
        // json schema errors have only one error message, but our frontend supports
        // an arbitrary number of messages per property. So we wrap it in an array.
        if (err.response.status === 422 && err.json.schema !== undefined) {
          const jsonSchemaError = {
            [err.json.jsonProperty]: [
              `Did not match the expected format: ${JSON.stringify(err.json.schema)}`,
            ],
          };

          dispatch(setErrors(jsonSchemaError));
        } else {
          const errorProperty = err.json.json_property || 'error';

          const wrappedError = {
            [errorProperty]: [err.json.error],
          };

          dispatch(setErrors(wrappedError));
        }
      } else {
        dispatch(setErrors(err.json));
      }
    } else {
      throw err;
    }
  }, [dispatch]);

  const formContext = useMemo(() => ({
    ...formState,
    unsavedChanges,
    dispatch,
    onSuccess,
    onError,
  }), [formState, unsavedChanges, dispatch, onSuccess, onError]);

  return (
    <FormContext.Provider value={formContext}>
      <SectionProvider
        disabled={globalDisabled}
        allowIgnoreDisabled={globalAllowIgnoreDisabled}
      >
        {children}
      </SectionProvider>
    </FormContext.Provider>
  );
}

export const useFormContext = () => useContext(FormContext);

export const useFormDispatch = () => useFormContext().dispatch;

export const useFormObject = () => useFormContext().object;
export const useFormInitialObject = () => useFormContext().initialObject;

export const useFormSuccessHandler = () => useFormContext().onSuccess;
export const useFormErrorHandler = () => useFormContext().onError;

export const useFormObjectSection = () => {
  const formObject = useFormObject();
  const sections = useSections();

  return readValueRecursive(formObject, sections);
};

export const useFormValue = (key, sections = []) => {
  const formObject = useFormObject();

  const formSection = readValueRecursive(formObject, sections);
  return useMemo(() => formSection[key], [formSection, key]);
};

export const useFormInitialValue = (key, sections = []) => {
  const initialFormObject = useFormInitialObject();

  const initialFormSection = readValueRecursive(initialFormObject, sections);
  return useMemo(() => initialFormSection[key], [initialFormSection, key]);
};

export const useFormUpdateAction = () => {
  const dispatch = useFormDispatch();

  return useCallback((key, value, sections = []) => (
    dispatch(updateFormValue(key, value, sections))
  ), [dispatch]);
};

export const useFormObjectState = (key, sections = []) => {
  const formObject = useFormObject();

  const formSection = readValueRecursive(formObject, sections);
  const formValue = formSection[key];

  const formUpdater = useFormUpdateAction();

  const setFormValue = useCallback(
    (value) => formUpdater(key, value, sections),
    [formUpdater, key, sections],
  );

  return [formValue, setFormValue];
};

export const useHasFormValueChanged = (key, sections = []) => {
  const formValue = useFormValue(key, sections);
  const formInitialValue = useFormInitialValue(key, sections);

  return !_.isEqual(formValue, formInitialValue);
};
