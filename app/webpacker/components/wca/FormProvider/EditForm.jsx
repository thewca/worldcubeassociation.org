import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef,
} from 'react';
import _ from 'lodash';
import {
  Button, Divider, Form, Message, Sticky,
} from 'semantic-ui-react';
import SectionProvider, { readValueRecursive, useSections } from './FormSection';
import formReducer from './store/reducer';
import { changesSaved, setErrors, updateFormValue } from './store/actions';
import FormErrors from './FormErrors';
import useSaveAction from '../../../lib/hooks/useSaveAction';

const FormContext = createContext();

export default function EditForm({
  children,
  initialObject,
  backendUrlFn,
  backendOptions,
  CustomHeader = null,
  CustomFooter = null,
}) {
  const initialState = useMemo(() => ({
    object: initialObject,
    initialObject,
    errors: null,
  }), [initialObject]);

  const [formState, dispatch] = useReducer(formReducer, initialState);

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

  const { save, saving } = useSaveAction();

  const saveObject = useCallback(() => {
    const saveUrl = backendUrlFn(formState.object, formState.initialObject);
    const saveOptions = backendOptions || {};

    save(saveUrl, formState.object, onSuccess, saveOptions, onError);
  }, [backendUrlFn, backendOptions, formState, save, onError, onSuccess]);

  const renderUnsavedChangesAlert = () => (
    <Message info>
      You have unsaved changes. Don&apos;t forget to
      {' '}
      <Button
        onClick={saveObject}
        disabled={saving}
        loading={saving}
        primary
      >
        save your changes!
      </Button>
    </Message>
  );

  const stickyRef = useRef();

  const formContext = useMemo(() => ({
    ...formState,
    unsavedChanges,
    dispatch,
  }), [formState, unsavedChanges]);

  return (
    <FormContext.Provider value={formContext}>
      <SectionProvider>
        <div ref={stickyRef}>
          {unsavedChanges && (
            <Sticky context={stickyRef} offset={20} styleElement={{ zIndex: 2000 }}>
              {renderUnsavedChangesAlert()}
            </Sticky>
          )}
          <FormErrors errors={formState.errors} />
          {CustomHeader !== null && <CustomHeader onError={onError} />}
          <Form>
            {children}
          </Form>
        </div>
        {CustomFooter ? (
          <>
            <Divider />
            <CustomFooter saveObject={saveObject} onError={onError} />
          </>
        ) : (unsavedChanges && renderUnsavedChangesAlert())}
      </SectionProvider>
    </FormContext.Provider>
  );
}

export const useFormContext = () => useContext(FormContext);

export const useFormDispatch = () => useFormContext().dispatch;

export const useFormObject = () => useFormContext().object;
export const useFormInitialObject = () => useFormContext().initialObject;

export const useFormObjectSection = () => {
  const formObject = useFormObject();
  const sections = useSections();

  return readValueRecursive(formObject, sections);
};

export const useFormUpdateAction = () => {
  const dispatch = useFormDispatch();

  return useCallback((key, value) => (
    dispatch(updateFormValue(key, value))
  ), [dispatch]);
};

export const useFormSectionUpdateAction = () => {
  const sections = useSections();
  const dispatch = useFormDispatch();

  return useCallback((key, value) => (
    dispatch(updateFormValue(key, value, sections))
  ), [dispatch, sections]);
};

export const useFormCommitAction = () => {
  const dispatch = useFormDispatch();

  return useCallback(() => (
    dispatch(changesSaved())
  ), [dispatch]);
};
