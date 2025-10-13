import React, { useMemo, useState } from 'react';
import {
  Button,
  Container,
  Form,
  Grid,
  Header,
  Image,
  Message,
  Popup,
} from 'semantic-ui-react';
import ReactCrop, {
  centerCrop,
  convertToPercentCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from 'react-image-crop';
import I18n from '../../lib/i18n';
import CroppedImage from './CroppedImage';

// Crop starts as 33% of the original image size
const SUGGESTED_IMG_RATIO = 33;

function ThumbnailEditor({
  imageSrc,
  thumbnail,
  onThumbnailSaved,
  editsDisabled,
}) {
  const [uiCropRel, setUiCropRel] = useState();

  const [naturalWidth, setNaturalWidth] = useState();
  const [naturalHeight, setNaturalHeight] = useState();

  const storedCropRel = useMemo(() => {
    if (thumbnail) {
      return convertToPercentCrop(thumbnail, naturalWidth, naturalHeight);
    }

    return undefined;
  }, [thumbnail, naturalWidth, naturalHeight]);

  const enableThumbnailCrop = () => setUiCropRel(storedCropRel);
  const disableThumbnailCrop = () => setUiCropRel(undefined);

  const isEditingThumbnail = useMemo(() => uiCropRel !== undefined, [uiCropRel]);

  const saveThumbnail = (evt) => {
    evt.preventDefault();

    if (naturalWidth && naturalHeight) {
      const cropAbs = convertToPixelCrop(uiCropRel, naturalWidth, naturalHeight);
      onThumbnailSaved(cropAbs);
    }

    disableThumbnailCrop();
  };

  const resetThumbnail = (evt) => {
    evt.preventDefault();

    disableThumbnailCrop();
  };

  const onImageLoad = (evt) => {
    const { naturalWidth: width, naturalHeight: height } = evt.currentTarget;

    setNaturalWidth(width);
    setNaturalHeight(height);

    disableThumbnailCrop();

    if (!thumbnail) {
      const aspectCrop = makeAspectCrop(
        {
          unit: '%',
          width: SUGGESTED_IMG_RATIO,
          height: SUGGESTED_IMG_RATIO,
        },
        1,
        width,
        height,
      );

      const defaultCropRel = centerCrop(aspectCrop, width, height);
      const defaultCropAbs = convertToPixelCrop(defaultCropRel, width, height);

      onThumbnailSaved(defaultCropAbs);
    }
  };

  const onThumbnailChange = (abs, rel) => setUiCropRel(rel);

  return (
    <>
      <ReactCrop
        aspect={1}
        ruleOfThirds
        keepSelection
        crop={uiCropRel}
        onChange={onThumbnailChange}
        disabled={!isEditingThumbnail}
        style={{ width: '100%' }}
      >
        <Image
          onLoad={onImageLoad}
          src={imageSrc}
          style={{ width: '100%', height: 'auto' }}
        />
      </ReactCrop>
      {isEditingThumbnail ? (
        <>
          <Message
            warning
            header={I18n.t('users.edit_avatar_thumbnail.cdn_warning')}
            content={I18n.t('users.edit_avatar_thumbnail.cdn_explanation')}
          />
          <Grid centered columns={3}>
            <Grid.Column textAlign="center">
              <Header>{I18n.t('users.edit_avatar_thumbnail.current')}</Header>
              <div className="user-avatar-image-large">
                <CroppedImage
                  crop={storedCropRel}
                  src={imageSrc}
                />
              </div>
            </Grid.Column>
            <Grid.Column textAlign="center">
              <Header>{I18n.t('users.edit_avatar_thumbnail.new')}</Header>
              <div className="user-avatar-image-large">
                <CroppedImage
                  crop={uiCropRel}
                  src={imageSrc}
                />
              </div>
            </Grid.Column>
            <Grid.Column textAlign="center" floated="right">
              <Form onSubmit={saveThumbnail}>
                <Button.Group icon vertical>
                  <Form.Button
                    type="submit"
                    primary
                    disabled={!uiCropRel}
                    icon="save"
                    content={I18n.t('users.edit_avatar_thumbnail.save')}
                  />
                  <Form.Button
                    negative
                    onClick={resetThumbnail}
                    disabled={!uiCropRel}
                    icon="cancel"
                    content={I18n.t('users.edit_avatar_thumbnail.reset')}
                  />
                </Button.Group>
              </Form>
            </Grid.Column>
          </Grid>
        </>
      ) : (
        !editsDisabled && (
          <Container textAlign="center">
            <Header>{I18n.t('users.edit.your_thumbnail')}</Header>
            <Popup
              content={I18n.t('users.edit.edit_thumbnail')}
              trigger={(
                <div className="user-avatar-image-large">
                  <CroppedImage
                    crop={uiCropRel || storedCropRel}
                    src={imageSrc}
                    onClick={enableThumbnailCrop}
                  />
                </div>
              )}
            />
          </Container>
        )
      )}
    </>
  );
}

export default ThumbnailEditor;
