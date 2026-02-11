import React, { useCallback, useRef } from 'react';
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
import FormObjectProvider, { useFormContext, useFormObject } from './provider/FormObjectProvider';
import ConfirmProvider, { useConfirm } from '../../../lib/providers/ConfirmProvider';
import useUnsavedChangesAlert from '../../../lib/hooks/useUnsavedChangesAlert';

function useSafeMutation(mutation, mutationArgs, unloadListener) {
  const { onSuccess: onFormSuccess, onError } = useFormContext();

  return useCallback(() => {
    window.removeEventListener('beforeunload', unloadListener);

    // The `saveMutation` may have side-effects like Redirects
    //   that are not supposed to trigger the "are you sure" warning.
    // TODO: Refactor `unsavedChanges` so that it doesn't fire in the first place
    mutation.mutate(mutationArgs, {
      onSuccess: (data) => {
        if (!data.redirect) {
          // We only want to call the form success handler, if we''re not being redirected.
          //   If a redirect is set, then the navigation takes a few milliseconds
          //   even on fast systems. These few ms might by enough to trigger
          //   corrupt follow-up behavior, especially when changing IDs.
          onFormSuccess();
        }
      },
      onError,
    });
  }, [unloadListener, mutation, mutationArgs, onFormSuccess, onError]);
}

export function FormActionButton({
  mutation,
  enabled = true,
  confirmationMessage = null,
  confirmationOptions = {},
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
        ...confirmationOptions,
      }).then(safeMutation);
    } else safeMutation();
  }, [confirm, confirmationMessage, confirmationOptions, safeMutation]);

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
  saveButtonText = null,
}) {
  const {
    unsavedChanges,
    errors,
  } = useFormContext();

  const onUnload = useUnsavedChangesAlert(unsavedChanges);

  const renderSaveButton = (buttonText) => (
    <FormActionButton
      mutation={saveMutation}
      buttonText={buttonText}
      buttonProps={{ primary: true }}
      onUnload={onUnload}
    />
  );

  const renderUnsavedChangesAlert = (showSaveButton = true) => (
    <Message info>
      You have unsaved changes.
      {showSaveButton && (
        <>
          {' '}
          Don&apos;t forget to
          {' '}
          {renderSaveButton('save your changes!')}
        </>
      )}
    </Message>
  );

  const stickyRef = useRef();

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <>
      <div ref={stickyRef}>
        {(unsavedChanges || errors) && (
          <Sticky context={stickyRef} offset={20} styleElement={{ zIndex: 2000 }}>
            {unsavedChanges && renderUnsavedChangesAlert()}
            {errors && <FormErrors errors={errors} />}
          </Sticky>
        )}
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
      <Divider />
      {unsavedChanges && renderUnsavedChangesAlert(false)}
      <ConfirmProvider>
        <Button.Group>
          {renderSaveButton(saveButtonText || 'Save')}
          {!unsavedChanges && footerActions.map((action) => (
            <FormActionButton key={action.id} onUnload={onUnload} {...action} />
          ))}
        </Button.Group>
      </ConfirmProvider>
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
  saveButtonText = null,
  globalDisabled = false,
  globalAllowIgnoreDisabled = true,
}) {
  return (
    <FormObjectProvider
      initialObject={initialObject}
      globalDisabled={globalDisabled}
      globalAllowIgnoreDisabled={globalAllowIgnoreDisabled}
    >
      <EditForm
        saveMutation={saveMutation}
        CustomHeader={CustomHeader}
        footerActions={footerActions}
        saveButtonText={saveButtonText}
      >
        {children}
      </EditForm>
    </FormObjectProvider>
  );
}
