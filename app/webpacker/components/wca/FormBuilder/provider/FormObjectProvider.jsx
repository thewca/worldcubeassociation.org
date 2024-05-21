import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import _ from 'lodash';
import { changesSaved, setErrors } from '../store/actions';
import formReducer from '../store/reducer';

const FormContext = createContext(null);

const createState = (initialObject) => ({
  object: initialObject,
  initialObject,
  errors: null,
});

export default function FormObjectProvider({
  children,
  initialObject,
}) {
  const [formState, dispatch] = useReducer(formReducer, initialObject, createState);

  const unsavedChanges = useMemo(() => (
    !_.isEqual(formState.object, formState.initialObject)
  ), [formState.object, formState.initialObject]);

  const onUnload = useCallback((e) => {
    // Prompt the user before letting them navigate away from this page with unsaved changes.
    if (unsavedChanges) {
      const confirmationMessage = 'You have unsaved changes, are you sure you want to leave?';
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }

    return null;
  }, [unsavedChanges]);

  useEffect(() => {
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [onUnload]);

  const onSuccess = useCallback((data) => {
    const { redirect } = data;

    if (redirect) {
      window.removeEventListener('beforeunload', onUnload);
      window.location.replace(redirect);
    } else {
      dispatch(changesSaved());
      dispatch(setErrors(null));
    }
  }, [dispatch, onUnload]);

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
      {children}
    </FormContext.Provider>
  );
}

export const useFormContext = () => useContext(FormContext);

export const useFormDispatch = () => useFormContext().dispatch;

export const useFormObject = () => useFormContext().object;
export const useFormInitialObject = () => useFormContext().initialObject;

export const useFormSuccessHandler = () => useFormContext().onSuccess;
export const useFormErrorHandler = () => useFormContext().onError;
