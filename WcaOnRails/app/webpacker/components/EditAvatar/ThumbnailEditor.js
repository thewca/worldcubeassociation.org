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
  initialCrop,
  editsDisabled,
  onThumbnailChanged,
}) {
  const [cropRel, setCropRel] = useState();
  const [uiCropRel, setUiCropRel] = useState();

  const [pendingCropAbs, setPendingCropAbs] = useState();

  const isEditingThumbnail = useMemo(() => uiCropRel !== undefined, [uiCropRel]);

  const enableThumbnailCrop = () => {
    setUiCropRel(cropRel);
  };

  const disableThumbnailCrop = () => {
    setUiCropRel(undefined);
  };

  const handleSaveThumbnail = (evt) => {
    evt.preventDefault();

    setCropRel(uiCropRel);
    disableThumbnailCrop();

    if (pendingCropAbs) {
      onThumbnailChanged(pendingCropAbs);
    }
  };

  const calculateNewCrop = (width, height) => {
    if (!initialCrop) {
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

      return centerCrop(
        aspectCrop,
        width,
        height,
      );
    } else {
      return convertToPercentCrop(initialCrop, width, height);
    }
  };

  const onImageLoad = (evt) => {
    const { naturalWidth: width, naturalHeight: height } = evt.currentTarget;

    const newCropRel = calculateNewCrop(width, height);
    setCropRel(newCropRel);

    const convertedCropAbs = convertToPixelCrop(newCropRel, width, height);
    setPendingCropAbs(convertedCropAbs);

    disableThumbnailCrop();
  };

  const onThumbnailChange = (abs, rel) => {
    setPendingCropAbs(abs);
    setUiCropRel(rel);
  };

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
      <Form onSubmit={handleSaveThumbnail}>
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
              onClick={disableThumbnailCrop}
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
                  crop={cropRel}
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
