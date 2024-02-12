import React, { useEffect, useMemo, useState } from 'react';
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

  const workingAvatar = useMemo(
    () => (isEditingPending ? data?.pendingAvatar : data?.avatar),
    [data, isEditingPending],
  );

  const [uploadedImage, setUploadedImage] = useState();
  const [imageURL, setImageURL] = useState();

  useEffect(() => {
    setImageURL(workingAvatar?.url);
  }, [workingAvatar]);

  const [cropAbs, setCropAbs] = useState();

  useEffect(() => {
    setCropAbs({
      x: workingAvatar?.thumbnail_crop_x,
      y: workingAvatar?.thumbnail_crop_y,
      width: workingAvatar?.thumbnail_crop_w,
      height: workingAvatar?.thumbnail_crop_h,
      unit: 'px',
    });
  }, [workingAvatar]);

  const [pendingAvatar, setPendingAvatar] = useState();

  useEffect(() => {
    setPendingAvatar(data?.pendingAvatar);
  }, [data]);

  useEffect(() => {
    if (!uploadedImage) return;

    const newImageURL = URL.createObjectURL(uploadedImage);
    setImageURL(newImageURL);
  }, [uploadedImage]);

  const { save, saving } = useSaveAction();

  const onThumbnailConfirmed = () => {
    if (!uploadedImage) {
      const thumbnailRaw = {
        x: cropAbs.x,
        y: cropAbs.y,
        w: cropAbs.width,
        h: cropAbs.height,
      };

      save(avatarDataUrl, { avatarId: workingAvatar?.id, thumbnail: thumbnailRaw }, sync);
    }
  };

  const confirmAvatarUpload = () => {
    const formData = new FormData();
    formData.append('file', uploadedImage);

    const thumbnailRaw = {
      x: cropAbs.x,
      y: cropAbs.y,
      w: cropAbs.width,
      h: cropAbs.height,
    };

    formData.append('thumbnail', JSON.stringify(thumbnailRaw));

    save(avatarDataUrl, formData, () => {
      setUploadedImage(undefined);
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

  const confirmAvatarDeletion = (reasonForDeletion) => {
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
          <Checkbox toggle checked={isEditingPending} onChange={setIsEditingPending} />
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
              onImageSelected={setUploadedImage}
              onImageSubmitted={confirmAvatarUpload}
              onImageDeleted={confirmAvatarDeletion}
            />
          </Grid.Column>
          <Grid.Column>
            <ThumbnailEditor
              imageSrc={imageURL}
              initialCrop={uploadedImage ? null : cropAbs}
              editsDisabled={!uploadedImage && data?.userData?.isDefaultAvatar}
              onThumbnailChanged={setCropAbs}
              onThumbnailSaved={onThumbnailConfirmed}
            />
          </Grid.Column>
        </Grid.Row>
      </Dimmer.Dimmable>
    </Container>
  );
}

export default EditAvatar;
