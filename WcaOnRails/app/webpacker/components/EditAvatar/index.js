import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Divider,
  Grid,
  Message,
} from 'semantic-ui-react';

import I18n from '../../lib/i18n';

import ImageUpload from './ImageUpload';

import 'react-image-crop/dist/ReactCrop.css';
import ThumbnailEditor from './ThumbnailEditor';
import useLoadedData from '../../lib/hooks/useLoadedData';
import { userAvatarDataUrl } from '../../lib/requests/routes.js.erb';
import Errored from '../Requests/Errored';

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

  return (
    <Container>
      {error && <Errored />}
      <Grid>
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
            />
          </Grid.Column>
          <Grid.Column>
            <ThumbnailEditor
              imageSrc={imageURL}
              crop={uploadedImage ? null : cropAbs}
              editsDisabled={!uploadedImage && avatarData?.isDefaultAvatar}
              onThumbnailChanged={setCropAbs}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
}

export default EditAvatar;
