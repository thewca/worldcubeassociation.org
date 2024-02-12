import React, { useEffect, useState } from 'react';
import {
  Button,
  Container,
  Form,
  Icon,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import useInputState from '../../lib/hooks/useInputState';
import useToggleButtonState from '../../lib/hooks/useToggleButtonState';

function ImageUpload({
  uploadDisabled,
  removalEnabled,
  onImageUploaded,
  onAvatarSaved,
  onAvatarDeleted,
}) {
  const [isRemoving, setIsRemoving] = useToggleButtonState(false);
  const [isConsenting, setIsConsenting] = useCheckboxState(false);

  const [selectedFile, setSelectedFile] = useState();

  // For some reason, Checkboxes are the _only_ form components in semantic where
  // browser-based (aka "magical") validation screws up and we have to manage error state ourselves.
  const [checkboxError, setCheckboxError] = useState(false);

  const [reasonForDeletion, setReasonForDeletion] = useInputState();

  const submitAvatar = (evt) => {
    evt.preventDefault();

    if (!isConsenting) {
      setCheckboxError(true);
    } else {
      setIsConsenting(false);
      // browser file choosers specifically need the empty string to clear the input
      setSelectedFile('');

      onAvatarSaved();
    }
  };

  const removeAvatar = (evt) => {
    evt.preventDefault();

    onAvatarDeleted(reasonForDeletion);
  };

  const handleSelectedImage = (evt, { value }) => {
    setIsConsenting(false);
    setSelectedFile(value);

    const selectedImage = evt.target.files[0];
    onImageUploaded(selectedImage);
  };

  useEffect(() => {
    if (isConsenting) {
      setCheckboxError(false);
    }
  }, [isConsenting]);

  return (
    <>
      <Container>
        <Form onSubmit={submitAvatar}>
          <Form.Input
            required
            label={I18n.t('activerecord.attributes.user.pending_avatar')}
            disabled={uploadDisabled}
            type="file"
            accept="image/*"
            value={selectedFile}
            onChange={handleSelectedImage}
          />
          <p>{I18n.t('simple_form.hints.user.pending_avatar')}</p>
          <Form.Checkbox
            required
            label={I18n.t('users.edit.guidelines_confirmation')}
            disabled={uploadDisabled}
            checked={isConsenting}
            onChange={setIsConsenting}
            error={checkboxError}
          />
          <Form.Button
            floated="left"
            primary
            type="submit"
            disabled={uploadDisabled}
          >
            {I18n.t('users.edit.save')}
          </Form.Button>
        </Form>
        {removalEnabled && (
          <Button
            floated="right"
            negative
            active={isRemoving}
            onClick={setIsRemoving}
          >
            {I18n.t('users.edit.remove_avatar')}
          </Button>
        )}
      </Container>
      {isRemoving && (
        <Container>
          <Form onSubmit={removeAvatar}>
            <Form.TextArea
              required
              placeholder={I18n.t('users.edit.remove_avatar_reason')}
              value={reasonForDeletion}
              onChange={setReasonForDeletion}
            />
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
