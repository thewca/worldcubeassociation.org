import React, { useState } from 'react';
import { Button, Form } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

function AvatarEdit({
  uploadDisabled,
  canRemoveAvatar,
  onImageUpload,
}) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleSaveAvatar = (evt) => {
    evt.preventDefault();

    console.log('evt', evt);
  };

  const handleSelectedImage = (evt) => {
    const selectedImage = evt.target.files[0];
    onImageUpload(selectedImage);
  };

  return (
    <Form onSubmit={handleSaveAvatar}>
      <Form.Input label={I18n.t('activerecord.attributes.user.pending_avatar')} type="file" accept="image/*" onChange={handleSelectedImage} />
      <p>{I18n.t('simple_form.hints.user.pending_avatar')}</p>
      <Form.Checkbox required label={I18n.t('users.edit.guidelines_confirmation')} disabled={uploadDisabled} />
      <div>
        <Form.Button primary>{I18n.t('users.edit.save')}</Form.Button>
        {!!canRemoveAvatar && (
          <Button
            negative
            onClick={() => setIsRemoving((old) => !old)}
          >
            {I18n.t('users.edit.remove_avatar')}
          </Button>
        )}
        {isRemoving && (
          <>
            <Form.TextArea placeholder={I18n.t('users.edit.remove_avatar_reason')} />
            <Form.Button negative>
              {I18n.t('users.edit.remove_avatar_confirm_button')}
            </Form.Button>
          </>
        )}
      </div>
    </Form>
  );
}

export default AvatarEdit;
