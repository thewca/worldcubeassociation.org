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
import { userAvatarDataUrl } from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';
import useSaveAction from '../../lib/hooks/useSaveAction';
import UserAvatar from '../UserAvatar';
import useCheckboxState from '../../lib/hooks/useCheckboxState';

function EditAvatar({
  userId,
  uploadDisabled,
  canRemoveAvatar,
}) {
  const avatarDataUrl = useMemo(() => userAvatarDataUrl(userId), [userId]);

  const {
    data,
    loading,
    error,
    sync,
  } = useLoadedData(avatarDataUrl);

  const [isEditingPending, setIsEditingPending] = useCheckboxState(false);
  const pendingAvatar = useMemo(() => data?.pendingAvatar, [data]);

  const workingAvatar = useMemo(
    () => (isEditingPending ? pendingAvatar : data?.avatar),
    [data, pendingAvatar, isEditingPending],
  );

  const [userUploadedImage, setUserUploadedImage] = useState();

  const imageURL = useMemo(() => {
    if (userUploadedImage) {
      return URL.createObjectURL(userUploadedImage);
    }

    return workingAvatar?.url;
  }, [workingAvatar, userUploadedImage]);

  const [userCropAbs, setUserCropAbs] = useState();

  const cropAbs = useMemo(() => {
    if (userCropAbs || userUploadedImage) {
      return userCropAbs;
    }

    return {
      x: workingAvatar?.thumbnail_crop_x,
      y: workingAvatar?.thumbnail_crop_y,
      width: workingAvatar?.thumbnail_crop_w,
      height: workingAvatar?.thumbnail_crop_h,
      unit: 'px',
    };
  }, [workingAvatar, userCropAbs, userUploadedImage]);

  const uploadUserImage = (img) => {
    // It is important to reset the crop first, so that
    // upon image load a default one can be computed.
    setUserCropAbs(undefined);

    setUserUploadedImage(img);
  };

  const { save, saving } = useSaveAction();

  const saveAvatarThumbnail = (newCropAbs) => {
    setUserCropAbs(newCropAbs);

    // If this state has a defined value, it means that the user is in the process of uploading
    // a new avatar and the thumbnail data will be submitted along with the picture later
    if (!userUploadedImage) {
      const thumbnailRaw = {
        x: newCropAbs.x,
        y: newCropAbs.y,
        w: newCropAbs.width,
        h: newCropAbs.height,
      };

      save(avatarDataUrl, { avatarId: workingAvatar?.id, thumbnail: thumbnailRaw }, sync);
    }
  };

  const saveAvatar = () => {
    const formData = new FormData();
    formData.append('file', userUploadedImage);

    const thumbnailRaw = {
      x: cropAbs.x,
      y: cropAbs.y,
      w: cropAbs.width,
      h: cropAbs.height,
    };

    formData.append('thumbnail', JSON.stringify(thumbnailRaw));

    save(avatarDataUrl, formData, () => {
      setUserUploadedImage(undefined);
      sync();
    }, {
      method: 'POST',
      // FIXME: We need to override this because otherwise the useSaveData hook
      //   tries to JSON-ify everything. But because we are uploading files, we neither want the
      //   application/json header, nor do we want to submit stringified JSON.
      headers: {},
      body: formData,
    });
  };

  const deleteAvatar = (reasonForDeletion) => {
    save(avatarDataUrl, { avatarId: workingAvatar?.id, reason: reasonForDeletion }, sync);
  };

  /* eslint-disable react/no-array-index-key */
  return (
    <Container>
      {error && <Errored />}
      {pendingAvatar && (
        <Message warning>
          There is a pending avatar for your user:
          <UserAvatar
            avatar={pendingAvatar}
            size="medium"
          />
          Click here if you want to edit its thumbnail instead:
          <Checkbox
            toggle
            checked={isEditingPending}
            onChange={setIsEditingPending}
          />
          {isEditingPending && <b>Editing pending avatar!</b>}
          {/* TODO: Path to admin if permission */}
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
              {data?.userData?.showStaffGuidelines && (
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
              uploadDisabled={uploadDisabled || isEditingPending}
              removalEnabled={canRemoveAvatar && !isEditingPending}
              onImageUploaded={uploadUserImage}
              onAvatarSaved={saveAvatar}
              onAvatarDeleted={deleteAvatar}
            />
          </Grid.Column>
          <Grid.Column>
            <ThumbnailEditor
              imageSrc={imageURL}
              storedCropAbs={cropAbs}
              editsDisabled={!userUploadedImage && data?.userData?.isDefaultAvatar}
              onThumbnailSaved={saveAvatarThumbnail}
            />
          </Grid.Column>
        </Grid.Row>
      </Dimmer.Dimmable>
    </Container>
  );
}

export default EditAvatar;
