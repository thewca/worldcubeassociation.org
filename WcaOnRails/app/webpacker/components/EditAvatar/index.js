import React, { useEffect, useMemo, useState } from 'react';
import {
  Container, Dimmer,
  Divider,
  Grid, Loader,
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

function EditAvatar({
  userId,
  uploadDisabled,
  canRemoveAvatar,
}) {
  const avatarDataUrl = useMemo(() => userAvatarDataUrl(userId), [userId]);

  const {
    data: avatarData,
    loading,
    error,
    sync,
  } = useLoadedData(avatarDataUrl);

  const [uploadedImage, setUploadedImage] = useState();
  const [imageURL, setImageURL] = useState();

  useEffect(() => {
    setImageURL(avatarData?.url);
  }, [avatarData]);

  const [cropAbs, setCropAbs] = useState();

  useEffect(() => {
    setCropAbs({
      x: avatarData?.thumbnail?.x,
      y: avatarData?.thumbnail?.y,
      width: avatarData?.thumbnail?.w,
      height: avatarData?.thumbnail?.h,
      unit: 'px',
    });
  }, [avatarData]);

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

      save(avatarDataUrl, { thumbnail: thumbnailRaw }, sync);
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
      headers: {},
      body: formData,
    });
  };

  const confirmAvatarDeletion = (reasonForDeletion) => {
    save(avatarDataUrl, { reason: reasonForDeletion }, sync);
  };

  return (
    <Container>
      {error && <Errored />}
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
              {avatarData?.isStaff && (
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
              uploadDisabled={uploadDisabled}
              removalEnabled={canRemoveAvatar}
              onImageSelected={setUploadedImage}
              onImageSubmitted={confirmAvatarUpload}
              onImageDeleted={confirmAvatarDeletion}
            />
          </Grid.Column>
          <Grid.Column>
            <ThumbnailEditor
              imageSrc={imageURL}
              initialCrop={uploadedImage ? null : cropAbs}
              editsDisabled={!uploadedImage && avatarData?.isDefaultAvatar}
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
