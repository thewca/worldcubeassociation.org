import React, { useEffect, useState } from 'react';
import {
  Form,
  Header,
  Icon,
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
  crop,
  editsDisabled,
  onThumbnailChanged,
}) {
  const [cropRel, setCropRel] = useState();
  const [uiCropRel, setUiCropRel] = useState();

  const [naturalWidth, setNaturalWidth] = useState();
  const [naturalHeight, setNaturalHeight] = useState();

  const [isEditingThumbnail, setEditingThumbnail] = useState(false);

  useEffect(() => {
    if (!naturalWidth || !naturalHeight) return;

    const cropAbs = convertToPixelCrop(cropRel, naturalWidth, naturalHeight);
    onThumbnailChanged(cropAbs);
  }, [cropRel, naturalWidth, naturalHeight, onThumbnailChanged]);

  const handleSaveThumbnail = (evt) => {
    evt.preventDefault();

    setCropRel(uiCropRel);
  };

  const enableThumbnailCrop = () => {
    setUiCropRel(cropRel);
    setEditingThumbnail(true);
  };

  const disableThumbnailCrop = () => {
    setUiCropRel(undefined);
    setEditingThumbnail(false);
  };

  const onImageLoad = (evt) => {
    const { naturalWidth: width, naturalHeight: height } = evt.currentTarget;

    setNaturalWidth(width);
    setNaturalHeight(height);

    if (!crop) {
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

      const centeredCrop = centerCrop(
        aspectCrop,
        width,
        height,
      );

      setCropRel(centeredCrop);
    } else {
      const convertedCropRel = convertToPercentCrop(crop, width, height);
      setCropRel(convertedCropRel);
    }

    disableThumbnailCrop();
  };

  return (
    <>
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
            src={imageSrc}
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
                onClick={disableThumbnailCrop}
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
      {!editsDisabled && (
        <>
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
        </>
      )}
    </>
  );
}

export default ThumbnailEditor;
