import React from 'react';
import { Message } from 'semantic-ui-react';
import { useStore } from '../../lib/providers/StoreProvider';
import { useFormContext } from '../wca/FormBuilder/provider/FormObjectProvider';
import ConfirmationActions, { CreateOrUpdateButton } from './ConfirmationActions';

export default function Footer({
  saveObject,
}) {
  const { isPersisted } = useStore();
  const { unsavedChanges } = useFormContext();

  if (isPersisted && !unsavedChanges) {
    return (
      <ConfirmationActions saveObject={saveObject} />
    );
  }

  return (
    <>
      {unsavedChanges && (
        <Message info>
          You have unsaved changes. Please save the competition before taking any other action.
        </Message>
      )}
      <CreateOrUpdateButton saveObject={saveObject} />
    </>
  );
}
