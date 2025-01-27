import React, {
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Button,
  Dimmer,
  Divider,
  Form,
  Message,
  Segment,
  Sticky,
} from 'semantic-ui-react';
import FormErrors from './FormErrors';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import FormObjectProvider, { useFormContext } from './provider/FormObjectProvider';

function EditForm({
  children,
  backendUrl,
  backendOptions,
  CustomHeader = null,
  CustomFooter = null,
}) {
  const {
    object,
    unsavedChanges,
    errors,
    onSuccess,
    onError,
  } = useFormContext();

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

    return () => window.removeEventListener('beforeunload', onUnload);
  }, [onUnload]);

  const onSuccessSafe = useCallback(() => {
    window.removeEventListener('beforeunload', onUnload);
    onSuccess();
    window.addEventListener('beforeunload', onUnload);
  }, [onSuccess, onUnload]);

  const { save, saving } = useSaveAction();

  const saveObject = useCallback(() => {
    const saveOptions = backendOptions || {};

    save(backendUrl, object, onSuccessSafe, saveOptions, onError);
  }, [backendUrl, backendOptions, object, save, onError, onSuccessSafe]);

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

  return (
    <>
      <div ref={stickyRef}>
        {unsavedChanges && (
          <Sticky context={stickyRef} offset={20} styleElement={{ zIndex: 2000 }}>
            {renderUnsavedChangesAlert()}
          </Sticky>
        )}
        <FormErrors errors={errors} />
        {CustomHeader && (
          <Dimmer.Dimmable as={Segment} blurring dimmed={unsavedChanges}>
            <Dimmer active={unsavedChanges}>
              You have unsaved changes. Please save the competition before taking any other action.
            </Dimmer>

            <CustomHeader />
          </Dimmer.Dimmable>
        )}
        <Form>
          {children}
        </Form>
      </div>
      {unsavedChanges && renderUnsavedChangesAlert()}
      {CustomFooter && (
        <>
          <Divider />
          <CustomFooter saveObject={saveObject} />
        </>
      )}
    </>
  );
}

export default function Wrapper({
  children,
  initialObject,
  backendUrl,
  backendOptions,
  CustomHeader = null,
  CustomFooter = null,
  globalDisabled = false,
}) {
  return (
    <FormObjectProvider
      initialObject={initialObject}
      globalDisabled={globalDisabled}
    >
      <EditForm
        backendUrl={backendUrl}
        backendOptions={backendOptions}
        CustomHeader={CustomHeader}
        CustomFooter={CustomFooter}
      >
        {children}
      </EditForm>
    </FormObjectProvider>
  );
}
