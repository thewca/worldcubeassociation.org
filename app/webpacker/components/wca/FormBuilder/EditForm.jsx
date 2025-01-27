import React, {
  useCallback,
  useRef,
} from 'react';
import {
  Button, Dimmer,
  Divider,
  Form, Header, List,
  Message, Segment,
  Sticky,
} from 'semantic-ui-react';
import SectionProvider, { readValueRecursive, useSections } from './provider/FormSectionProvider';
import { changesSaved, updateFormValue } from './store/actions';
import FormErrors from './FormErrors';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import FormObjectProvider, { useFormContext, useFormDispatch, useFormObject } from './provider/FormObjectProvider';
import I18n from "../../../lib/i18n";

function EditForm({
  children,
  backendUrl,
  backendOptions,
  CustomHeader = null,
  CustomFooter = null,
  globalDisabled = false,
}) {
  const {
    object,
    unsavedChanges,
    errors,
    onSuccess,
    onError,
  } = useFormContext();

  const { save, saving } = useSaveAction();

  const saveObject = useCallback(() => {
    const saveOptions = backendOptions || {};

    save(backendUrl, object, onSuccess, saveOptions, onError);
  }, [backendUrl, backendOptions, object, save, onError, onSuccess]);

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
    <SectionProvider disabled={globalDisabled}>
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
      {(unsavedChanges && renderUnsavedChangesAlert())}
      {CustomFooter && (
        <>
          <Divider />
          <CustomFooter saveObject={saveObject} />
        </>
      )}
    </SectionProvider>
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
    <FormObjectProvider initialObject={initialObject}>
      <EditForm
        backendUrl={backendUrl}
        backendOptions={backendOptions}
        CustomHeader={CustomHeader}
        CustomFooter={CustomFooter}
        globalDisabled={globalDisabled}
      >
        {children}
      </EditForm>
    </FormObjectProvider>
  );
}

export const useFormObjectSection = () => {
  const formObject = useFormObject();
  const sections = useSections();

  return readValueRecursive(formObject, sections);
};

export const useFormUpdateAction = () => {
  const dispatch = useFormDispatch();

  return useCallback((key, value, sections = []) => (
    dispatch(updateFormValue(key, value, sections))
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
