import React, {
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Button,
  Dimmer, Divider,
  Form,
  Message,
  Segment,
  Sticky,
} from 'semantic-ui-react';
import FormErrors from './FormErrors';
import FormObjectProvider, { useFormContext, useFormObject } from './provider/FormObjectProvider';
import ConfirmProvider, { useConfirm } from '../../../lib/providers/ConfirmProvider';

function useSafeMutation(mutation, mutationArgs, unloadListener) {
  const { onSuccess, onError } = useFormContext();

  return useCallback(() => {
    window.removeEventListener('beforeunload', unloadListener);

    // The `saveMutation` may have side-effects like Redirects
    //   that are not supposed to trigger the "are you sure" warning.
    // TODO: Refactor `unsavedChanges` so that it doesn't fire in the first place
    mutation.mutate(mutationArgs, { onSuccess, onError });
  }, [unloadListener, mutation, mutationArgs, onSuccess, onError]);
}

export function FormActionButton({
  mutation,
  enabled = true,
  confirmationMessage = null,
  buttonText = null,
  buttonProps,
  onUnload,
  children,
}) {
  const confirm = useConfirm();
  const formObject = useFormObject();

  const safeMutation = useSafeMutation(mutation, formObject, onUnload);

  const handleClick = useCallback(() => {
    if (confirmationMessage) {
      confirm({
        content: confirmationMessage,
      }).then(safeMutation);
    } else safeMutation();
  }, [confirm, confirmationMessage, safeMutation]);

  if (!enabled) return null;

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Button
      onClick={handleClick}
      disabled={mutation.isPending}
      loading={mutation.isPending}
      {...buttonProps}
    >
      {buttonText || children}
    </Button>
  );
  /* eslint-enable react/jsx-props-no-spreading */
}

function EditForm({
  children,
  saveMutation,
  CustomHeader = null,
  footerActions = [],
}) {
  const {
    unsavedChanges,
    errors,
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

  const renderSaveButton = (buttonText) => (
    <FormActionButton
      mutation={saveMutation}
      buttonText={buttonText}
      buttonProps={{ primary: true }}
      onUnload={onUnload}
    />
  );

  const renderUnsavedChangesAlert = () => (
    <Message info>
      You have unsaved changes. Don&apos;t forget to
      {' '}
      {renderSaveButton('save your changes!')}
    </Message>
  );

  const stickyRef = useRef();

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <>
      <div ref={stickyRef}>
        <FormErrors errors={errors} />
        {CustomHeader && (
          <Dimmer.Dimmable as={Segment} blurring dimmed={unsavedChanges}>
            <Dimmer active={unsavedChanges}>
              You have unsaved changes. Please save the competition before taking any other action.
            </Dimmer>

            <CustomHeader />
          </Dimmer.Dimmable>
        )}
        {unsavedChanges && (
          <Sticky context={stickyRef} offset={20} styleElement={{ zIndex: 2000 }}>
            {renderUnsavedChangesAlert()}
          </Sticky>
        )}
        <Form>
          {children}
        </Form>
      </div>
      {unsavedChanges ? renderUnsavedChangesAlert() : (
        <ConfirmProvider>
          <Divider />
          <Button.Group>
            {renderSaveButton('Save')}
            {footerActions.map((action) => (
              <FormActionButton key={action.id} onUnload={onUnload} {...action} />
            ))}
          </Button.Group>
        </ConfirmProvider>
      )}
    </>
  );
  /* eslint-enable react/jsx-props-no-spreading */
}

export default function Wrapper({
  children,
  initialObject,
  saveMutation,
  CustomHeader = null,
  footerActions = [],
  globalDisabled = false,
}) {
  return (
    <FormObjectProvider
      initialObject={initialObject}
      globalDisabled={globalDisabled}
    >
      <EditForm
        saveMutation={saveMutation}
        CustomHeader={CustomHeader}
        footerActions={footerActions}
      >
        {children}
      </EditForm>
    </FormObjectProvider>
  );
}
