import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef,
} from 'react';
import _ from 'lodash';
import { Button, Message, Sticky } from 'semantic-ui-react';
import SectionProvider from './FormSection';
import formReducer from './store/reducer';
import { changesSaved, setErrors } from './store/actions';

const FormContext = createContext();

export default function EditForm({
  children, initialState, saveAction, isSaving,
}) {
  const [formState, dispatch] = useReducer(formReducer, initialState);

  const unsavedChanges = useMemo(() => (
    !_.isEqual(formState, initialState)
  ), [formState, initialState]);

  const onUnload = useCallback((e) => {
    // Prompt the user before letting them navigate away from this page with unsaved changes.
    if (unsavedChanges) {
      const confirmationMessage = 'You have unsaved changes, are you sure you want to leave?';
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }

    return null;
  }, [unsavedChanges]);

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

  useEffect(() => {
    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [onUnload]);

  const renderUnsavedChangesAlert = () => (
    <Message info>
      You have unsaved changes. Don&apos;t forget to
      {' '}
      <Button
        onClick={saveAction}
        disabled={isSaving}
        loading={isSaving}
        primary
      >
        save your changes!
      </Button>
    </Message>
  );

  const stickyRef = useRef();

  const formContext = useMemo(() => ({
    state: formState,
    initialState,
    unsavedChanges,
  }), [formState, initialState, unsavedChanges]);

  return (
    <FormContext.Provider value={formContext}>
      <SectionProvider>
        <div ref={stickyRef}>
          {unsavedChanges && (
            <Sticky context={stickyRef} offset={20} styleElement={{ zIndex: 2000 }}>
              {renderUnsavedChangesAlert()}
            </Sticky>
          )}
          {children}
        </div>
      </SectionProvider>
    </FormContext.Provider>
  );
}

export const useFormContext = () => useContext(FormContext);

export const useFormObject = () => useFormContext().state;
export const useInitialFormObject = () => useFormContext().initialState;
