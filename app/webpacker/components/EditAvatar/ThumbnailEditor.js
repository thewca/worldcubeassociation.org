import React, { useMemo, useState } from 'react';
import {
  Button, Container,
  Form,
  Header,
  Icon,
  Image,
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
  storedCropAbs,
  editsDisabled,
  onThumbnailSaved,
}) {
  const [uiCropRel, setUiCropRel] = useState();

  const [naturalWidth, setNaturalWidth] = useState();
  const [naturalHeight, setNaturalHeight] = useState();

  const storedCropRel = useMemo(() => {
    if (storedCropAbs) {
      return convertToPercentCrop(storedCropAbs, naturalWidth, naturalHeight);
    }

    return undefined;
  }, [storedCropAbs, naturalWidth, naturalHeight]);

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

    if (!storedCropAbs) {
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
      <Form onSubmit={saveThumbnail}>
        {isEditingThumbnail && (
          <Button.Group icon floated="right">
            <Form.Button
              primary
              disabled={!uiCropRel}
            >
              <Icon name="save" />
            </Form.Button>
            <Form.Button
              negative
              onClick={resetThumbnail}
              disabled={!uiCropRel}
            >
              <Icon name="cancel" />
            </Form.Button>
          </Button.Group>
        )}
      </Form>
      {!editsDisabled && (
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
      )}
    </>
  );
}

export default ThumbnailEditor;
