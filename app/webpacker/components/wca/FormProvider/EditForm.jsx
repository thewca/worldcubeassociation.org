import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef,
} from 'react';
import _ from 'lodash';
import { Button, Message, Sticky } from 'semantic-ui-react';
import SectionProvider from './FormSection';
import formReducer from './store/reducer';

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

  const formContext = useMemo(() => ([
    formState,
    initialState,
    unsavedChanges,
  ]), [formState, initialState, unsavedChanges]);

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

export const useFormObject = () => useContext(FormContext)[0];

export const useInitialFormObject = () => useContext(FormContext)[1];
