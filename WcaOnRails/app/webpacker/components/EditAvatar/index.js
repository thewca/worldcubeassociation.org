import React, { useEffect, useState } from 'react';
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

function EditAvatar({
  user,
  staff,
  crop,
  uploadDisabled,
  canRemoveAvatar,
}) {
  const [uploadedImage, setUploadedImage] = useState();
  const [imageURL, setImageURL] = useState(user.avatar?.url);

  const [cropAbs, setCropAbs] = useState(crop);

  useEffect(() => {
    if (!uploadedImage) return;

    const newImageURL = URL.createObjectURL(uploadedImage);
    setImageURL(newImageURL);
  }, [uploadedImage]);

  return (
    <Container>
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
              {staff && (
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
              imageURL={imageURL}
              preCalculatedCrop={uploadedImage ? null : crop}
              editsDisabled={!user.avatar}
              onThumbnailChanged={setCropAbs}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
}

export default EditAvatar;
