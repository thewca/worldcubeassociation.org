import React, { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Divider,
  Form,
  Header,
  Image,
  Icon,
  Message,
  Popup, Grid,
} from 'semantic-ui-react';
import ReactCrop, { centerCrop, convertToPercentCrop, makeAspectCrop } from 'react-image-crop';

import I18n from '../../lib/i18n';

import UploadForm from './UploadForm';
import CroppedImage from './CroppedImage';

import 'react-image-crop/dist/ReactCrop.css';

// Crop starts as 33% of the original image size
const SUGGESTED_IMG_RATIO = 33;

function EditAvatar({
  user,
  staff,
  crop,
  uploadDisabled,
  canRemoveAvatar,
}) {
  const [cropRel, setCropRel] = useState();
  const [uiCropRel, setUiCropRel] = useState();

  const [isEditingThumbnail, setEditingThumbnail] = useState(false);

  const [uploadedImage, setUploadedImage] = useState();
  const [imageURL, setImageURL] = useState(user.avatar.url);

  const clearThumbnailSelector = useCallback(() => {
    setUiCropRel(undefined);
    setEditingThumbnail(false);
  }, []);

  useEffect(() => {
    if (!uploadedImage) return;

    clearThumbnailSelector();

    const newImageURL = URL.createObjectURL(uploadedImage);
    setImageURL(newImageURL);
  }, [uploadedImage, clearThumbnailSelector]);

  const onImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;

    // Only reset the cropping if a new image is being uploaded
    if (uploadedImage) {
      const aspectCrop = makeAspectCrop(
        {
          unit: '%',
          width: SUGGESTED_IMG_RATIO,
          height: SUGGESTED_IMG_RATIO,
        },
        1,
        naturalWidth,
        naturalHeight,
      );

      const centeredCrop = centerCrop(
        aspectCrop,
        naturalWidth,
        naturalHeight,
      );

      setCropRel(centeredCrop);
    } else {
      const relCrop = convertToPercentCrop(crop, naturalWidth, naturalHeight);
      setCropRel(relCrop);
    }
  };

  const handleSaveThumbnail = (evt) => {
    evt.preventDefault();

    setCropRel(uiCropRel);
  };

  const onEditThumbnail = () => {
    setUiCropRel(cropRel);
    setEditingThumbnail(true);
  };

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
            <UploadForm
              uploadDisabled={uploadDisabled}
              canRemoveAvatar={canRemoveAvatar}
              onImageUpload={setUploadedImage}
            />
          </Grid.Column>
          <Grid.Column>
            <Form onSubmit={handleSaveThumbnail}>
              <ReactCrop
                aspect={1}
                ruleOfThirds
                keepSelection
                crop={uiCropRel}
                onChange={(abs, rel) => setUiCropRel(rel)}
                disabled={!isEditingThumbnail}
                style={{ width: '100%' }}
              >
                <Image
                  onLoad={onImageLoad}
                  src={imageURL}
                  style={{ width: '100%', height: 'auto' }}
                />
              </ReactCrop>

              {isEditingThumbnail && (
                <>
                  <div>
                    <Form.Button
                      icon
                      primary
                      floated="right"
                      disabled={!uiCropRel}
                    >
                      <Icon name="save" />
                    </Form.Button>
                    <Form.Button
                      icon
                      negative
                      floated="right"
                      onClick={clearThumbnailSelector}
                      disabled={!uiCropRel}
                    >
                      <Icon name="cancel" />
                    </Form.Button>
                  </div>
                  <Message warning visible>
                    <Message.Header>{I18n.t('users.edit_avatar_thumbnail.cdn_warning')}</Message.Header>
                    <p>{I18n.t('users.edit_avatar_thumbnail.cdn_explanation')}</p>
                  </Message>
                </>
              )}
            </Form>
            {user.avatar && (
              <>
                <Header>{I18n.t('users.edit.your_thumbnail')}</Header>
                <Popup
                  content={I18n.t('users.edit.edit_thumbnail')}
                  trigger={(
                    <div className="user-avatar-image-large">
                      <CroppedImage
                        crop={cropRel}
                        src={imageURL}
                        onClick={onEditThumbnail}
                      />
                    </div>
                  )}
                />
              </>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
}

export default EditAvatar;
