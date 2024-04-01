import React, {
  useCallback,
  useRef,
} from 'react';
import {
  Button,
  Divider,
  Form,
  Message,
  Sticky,
} from 'semantic-ui-react';
import SectionProvider, { readValueRecursive, useSections } from './FormSection';
import { changesSaved, updateFormValue } from './store/actions';
import FormErrors from './FormErrors';
import useSaveAction from '../../../lib/hooks/useSaveAction';
import FormObjectProvider, { useFormContext, useFormDispatch, useFormObject } from './provider/FormObjectProvider';

function EditForm({
  children,
  backendUrlFn,
  backendOptions,
  CustomHeader = null,
  CustomFooter = null,
}) {
  const {
    object,
    initialObject,
    unsavedChanges,
    errors,
    onSuccess,
    onError,
  } = useFormContext();

  const { save, saving } = useSaveAction();

  const saveObject = useCallback(() => {
    const saveUrl = backendUrlFn(object, initialObject);
    const saveOptions = backendOptions || {};

    save(saveUrl, object, onSuccess, saveOptions, onError);
  }, [backendUrlFn, backendOptions, object, initialObject, save, onError, onSuccess]);

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
    <SectionProvider>
      <div ref={stickyRef}>
        {unsavedChanges && (
          <Sticky context={stickyRef} offset={20} styleElement={{ zIndex: 2000 }}>
            {renderUnsavedChangesAlert()}
          </Sticky>
        )}
        <FormErrors errors={errors} />
        {CustomHeader && <CustomHeader />}
        <Form>
          {children}
        </Form>
      </div>
      {CustomFooter ? (
        <>
          <Divider />
          <CustomFooter saveObject={saveObject} />
        </>
      ) : (unsavedChanges && renderUnsavedChangesAlert())}
    </SectionProvider>
  );
}

export default function Wrapper({
  children,
  initialObject,
  backendUrlFn,
  backendOptions,
  CustomHeader = null,
  CustomFooter = null,
}) {
  return (
    <FormObjectProvider initialObject={initialObject}>
      <SectionProvider>
        <EditForm
          backendUrlFn={backendUrlFn}
          backendOptions={backendOptions}
          CustomHeader={CustomHeader}
          CustomFooter={CustomFooter}
        >
          {children}
        </EditForm>
      </SectionProvider>
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
