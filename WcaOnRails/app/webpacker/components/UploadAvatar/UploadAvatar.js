import React, { useRef, useState } from 'react';
import { Button, Divider, Form, Header, Image, Icon, Message, Popup } from 'semantic-ui-react';
import ReactCrop from 'react-image-crop';

import I18n from '../../lib/i18n';
import AvatarEdit from './AvatarEdit';

import 'react-image-crop/dist/ReactCrop.css';

// Crop starts as 25% of the original image size
const SUGGESTED_IMG_RATIO = 4;

function UploadAvatar({
  user,
  staff,
  uploadDisabled,
  canRemoveAvatar,
}) {
  const [crop, setCrop] = useState();
  const [editingThumbnail, setEditingThumbnail] = useState(false);
  const imgRef = useRef(null);

  const startCropImage = () => {
    const imgWidth = imgRef.current?.clientWidth;
    const imgHeight = imgRef.current?.clientHeight;

    const initialDimension = Math.min(imgWidth, imgHeight) / 2;

    setCrop({
      x: imgWidth / SUGGESTED_IMG_RATIO,
      y: imgHeight / SUGGESTED_IMG_RATIO,
      width: initialDimension,
      height: initialDimension,
      unit: 'px',
    });

    setEditingThumbnail(true);
  };

  const handleSaveThumbnail = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();

    console.log(crop);
  };

  const onCancelThumbnail = () => {
    setCrop(undefined);
    setEditingThumbnail(false);
  };

  return (
    <section className="container">
      <div className="row">
        <div className="col-sm-6 ">
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
          <AvatarEdit
            uploadDisabled={uploadDisabled}
            canRemoveAvatar={canRemoveAvatar}
          />
        </div>
        <div className="col-sm-6 text-center">
          <Form onSubmit={handleSaveThumbnail}>
            <ReactCrop
              aspect={1}
              crop={crop}
              onChange={setCrop}
              disabled={!editingThumbnail} // TODO include :pending_avatar
              style={{ width: '100%' }}
            >
              <img
                ref={imgRef}
                src={user.avatar.url}
                style={{ width: '100%', height: 'auto' }}
              />
            </ReactCrop>

            {editingThumbnail && (
              <>
                <div className="row">
                  <Form.Button
                    icon
                    primary
                    floated="right"
                    disabled={!crop}
                  >
                    <Icon name="save" />
                  </Form.Button>
                  <Button
                    icon
                    negative
                    floated="right"
                    onClick={onCancelThumbnail}
                    disabled={!crop}
                  >
                    <Icon name="cancel" />
                  </Button>
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
                  <Image
                    src={user.avatar.thumb_url}
                    style={{ width: '20%', height: 'auto' }}
                    onClick={startCropImage}
                  />
                )}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default UploadAvatar;
