import React, { useEffect, useState } from 'react';
import { Button, Container, Form, Icon } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import useInputState from '../../lib/hooks/useInputState';

function ImageUpload({
  uploadDisabled,
  removalEnabled,
  onImageSelected,
  onImageSubmitted,
  onImageDeleted,
}) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConsenting, setIsConsenting] = useCheckboxState(false);

  // For some reason, Checkboxes are the _only_ form components in semantic where
  // browser-based (aka "magical") validation screws up and we have to manage error state ourselves.
  const [checkboxError, setCheckboxError] = useState(false);

  const [reasonForDeletion, setReasonForDeletion] = useInputState();

  const handleSaveAvatar = (evt) => {
    evt.preventDefault();

    if (!isConsenting) {
      setCheckboxError(true);
    } else {
      onImageSubmitted();
    }
  };

  const handleRemoveAvatar = (evt) => {
    evt.preventDefault();

    onImageDeleted();
  };

  const clearFormErrors = () => setCheckboxError(false);

  const handleSelectedImage = (evt) => {
    const selectedImage = evt.target.files[0];
    onImageSelected(selectedImage);

    setIsConsenting(false);
  };

  useEffect(() => {
    if (isConsenting) {
      clearFormErrors();
    }
  }, [isConsenting]);

  return (
    <>
      <Container>
        <Form onSubmit={handleSaveAvatar}>
          <Form.Input required label={I18n.t('activerecord.attributes.user.pending_avatar')} type="file" accept="image/*" onChange={handleSelectedImage} />
          <p>{I18n.t('simple_form.hints.user.pending_avatar')}</p>
          <Form.Checkbox required label={I18n.t('users.edit.guidelines_confirmation')} disabled={uploadDisabled} checked={isConsenting} onChange={setIsConsenting} error={checkboxError} />
          <Form.Button floated="left" primary disabled={uploadDisabled}>{I18n.t('users.edit.save')}</Form.Button>
        </Form>
        {removalEnabled && (
          <Button
            floated="right"
            negative
            onClick={() => setIsRemoving((old) => !old)}
          >
            {I18n.t('users.edit.remove_avatar')}
          </Button>
        )}
      </Container>
      {isRemoving && (
        <Container>
          <Form onSubmit={handleRemoveAvatar}>
            <Form.TextArea required placeholder={I18n.t('users.edit.remove_avatar_reason')} value={reasonForDeletion} onChange={setReasonForDeletion} />
            <Form.Button negative icon>
              <Icon name="trash" />
              {I18n.t('users.edit.remove_avatar_confirm_button')}
            </Form.Button>
          </Form>
        </Container>
      )}
    </>
  );
}

export default ImageUpload;
