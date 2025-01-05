import React, { useMemo, useState } from 'react';
import {
  Checkbox,
  Container,
  Dimmer,
  Divider,
  Grid,
  Loader,
  Message,
} from 'semantic-ui-react';

import I18n from '../../lib/i18n';

import ImageUpload from './ImageUpload';

import 'react-image-crop/dist/ReactCrop.css';
import ThumbnailEditor from './ThumbnailEditor';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { userAvatarDataUrl, panelUrls } from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';
import useSaveAction from '../../lib/hooks/useSaveAction';
import UserAvatar from '../UserAvatar';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import { avatarImageTypes } from '../../lib/wca-data.js.erb';

function EditAvatar({
  userId,
  showStaffGuidelines,
  uploadDisabled,
  canRemoveAvatar,
  canAdminAvatars,
}) {
  const avatarDataUrl = useMemo(() => userAvatarDataUrl(userId), [userId]);

  const {
    data,
    loading,
    error,
    sync,
  } = useLoadedData(avatarDataUrl);

  const [uploadedImageErrors, setUploadedImageErrors] = useState();
  const [isEditingPending, setIsEditingPending] = useCheckboxState(false);

  const currentAvatar = useMemo(() => data?.avatar, [data]);
  const pendingAvatar = useMemo(() => data?.pendingAvatar, [data]);

  const workingAvatar = useMemo(
    () => (isEditingPending ? pendingAvatar : currentAvatar),
    [currentAvatar, pendingAvatar, isEditingPending],
  );

  const [userUploadedImage, setUserUploadedImage] = useState();

  const imageURL = useMemo(() => {
    if (userUploadedImage) {
      return URL.createObjectURL(userUploadedImage);
    }

    return workingAvatar?.url;
  }, [workingAvatar, userUploadedImage]);

  const isValidContentType = useMemo(() => {
    if (!userUploadedImage) return true;

    return avatarImageTypes.includes(userUploadedImage.type);
  }, [userUploadedImage]);

  const workingThumbnail = useMemo(() => ({
    x: workingAvatar?.thumbnail_crop_x,
    y: workingAvatar?.thumbnail_crop_y,
    width: workingAvatar?.thumbnail_crop_w,
    height: workingAvatar?.thumbnail_crop_h,
    unit: 'px',
  }), [workingAvatar]);

  const [userCropAbs, setUserCropAbs] = useState();

  const cropAbs = useMemo(() => {
    if (userCropAbs || userUploadedImage) {
      return userCropAbs;
    }

    return workingThumbnail;
  }, [workingThumbnail, userCropAbs, userUploadedImage]);

  const uploadUserImage = (img) => {
    // It is important to reset the crop first, so that
    // upon image load a default one can be computed.
    setUserCropAbs(undefined);

    setUserUploadedImage(img);
    setUploadedImageErrors(null);
  };

  const { save, saving } = useSaveAction();

  const saveAvatarThumbnail = (newCropAbs) => {
    setUserCropAbs(newCropAbs);

    // If this state has a defined value, it means that the user is in the process of uploading
    // a new avatar and the thumbnail data will be submitted along with the picture later
    if (!userUploadedImage) {
      save(avatarDataUrl, { avatarId: workingAvatar?.id, thumbnail: newCropAbs }, sync);
    }
  };

  const saveAvatar = () => {
    const formData = new FormData();

    formData.append('file', userUploadedImage);
    formData.append('thumbnail', JSON.stringify(cropAbs));

    save(avatarDataUrl, formData, () => {
      setUserUploadedImage(undefined);
      setUploadedImageErrors(null);

      sync();
    }, {
      method: 'POST',
      // FIXME: We need to override this because otherwise the useSaveData hook
      //   tries to JSON-ify everything. But because we are uploading files, we neither want the
      //   application/json header, nor do we want to submit stringified JSON.
      headers: {},
      body: formData,
    }, (err) => {
      if (err.json !== null) {
        // whatever photo is uploaded here, it will end up in `private_image`.
        // Even admin users don't have permission to write to `public_image` directly.
        const imageErrors = err.json.private_image;
        setUploadedImageErrors(imageErrors);
      } else {
        // Let the JS console do its thing.
        throw err;
      }
    });
  };

  const deleteAvatar = (reasonForDeletion, cleanupFn) => {
    save(avatarDataUrl, { avatarId: workingAvatar?.id, reason: reasonForDeletion }, () => {
      sync();
      cleanupFn();
    }, {
      method: 'DELETE',
    });
  };

  /* eslint-disable react/no-array-index-key */
  return (
    <Container>
      {error && <Errored />}
      {pendingAvatar && (
        <Message warning>
          {I18n.t('users.edit.pending_avatar_confirmation')}
          <UserAvatar
            avatar={pendingAvatar}
            size="medium"
          />
          {I18n.t('users.edit.pending_avatar_edit_action')}
          <Checkbox
            toggle
            checked={isEditingPending}
            onChange={setIsEditingPending}
          />
          {isEditingPending && <b>{I18n.t('users.edit.pending_avatar_edit_warning')}</b>}
          {canAdminAvatars && <a href={panelUrls.wrt.approveAvatars}>{I18n.t('users.edit.manage_pending')}</a>}
        </Message>
      )}
      {uploadedImageErrors && (
        <Message error>
          <Message.List>
            {uploadedImageErrors.map((errItem) => (
              <Message.Item key={errItem}>{errItem}</Message.Item>
            ))}
          </Message.List>
        </Message>
      )}
      <Dimmer.Dimmable as={Grid}>
        <Dimmer active={loading} inverted>
          <Loader content="Loading" />
        </Dimmer>

        <Dimmer active={saving} inverted>
          <Loader content="Saving" />
        </Dimmer>

        <Grid.Row columns={2}>
          <Grid.Column>
            <Message visible>
              <Message.Header>{I18n.t('users.edit.guidelines')}</Message.Header>
              <Message.List>
                {I18n.tArray('users.edit.avatar_guidelines').map((guideline, idx) => (
                  <Message.Item key={idx}>{guideline}</Message.Item>
                ))}
              </Message.List>
              {showStaffGuidelines && (
                <>
                  <Divider />
                  <Message.Header>{I18n.t('users.edit.staff_avatar_guidelines.title')}</Message.Header>
                  <Message.List>
                    {I18n.tArray('users.edit.staff_avatar_guidelines.paragraphs').map((guideline, idx) => (
                      <Message.Item key={idx}>{guideline}</Message.Item>
                    ))}
                  </Message.List>
                </>
              )}
            </Message>
            <ImageUpload
              uploadDisabled={uploadDisabled || isEditingPending || !isValidContentType}
              removalEnabled={canRemoveAvatar && !isEditingPending}
              onImageUploaded={uploadUserImage}
              onAvatarSaved={saveAvatar}
              onAvatarDeleted={deleteAvatar}
            />
          </Grid.Column>
          <Grid.Column>
            <ThumbnailEditor
              imageSrc={imageURL}
              thumbnail={cropAbs}
              onThumbnailSaved={saveAvatarThumbnail}
              editsDisabled={!userUploadedImage && !workingAvatar?.can_edit_thumbnail}
            />
          </Grid.Column>
        </Grid.Row>
      </Dimmer.Dimmable>
    </Container>
  );
}

export default EditAvatar;
