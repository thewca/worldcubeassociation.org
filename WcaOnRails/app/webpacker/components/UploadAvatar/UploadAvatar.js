import React, { useRef, useState } from 'react';
import { Icon, Popup } from 'semantic-ui-react';
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
    setEditingThumbnail(true);
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
          <div className="well">
            <h3>{I18n.t('users.edit.guidelines')}</h3>
            <ul>
              {I18n.tArray('users.edit.avatar_guidelines').map((guideline, idx) => (
                <li key={idx}>{guideline}</li>
              ))}
            </ul>
            {staff && (
              <>
                <h3>{I18n.t('users.edit.staff_avatar_guidelines.title')}</h3>
                <ul>
                  {I18n.tArray('users.edit.staff_avatar_guidelines.paragraphs').map((guideline, idx) => (
                    <li key={idx}>{guideline}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <AvatarEdit
            uploadDisabled={uploadDisabled}
            canRemoveAvatar={canRemoveAvatar}
          />
        </div>
        <div className="col-sm-6 text-center">
          <form onSubmit={handleSaveThumbnail}>
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
              <div>
                <div className="row">
                  <button
                    className="btn btn-primary pull-right"
                    type="submit"
                    disabled={!crop}
                  >
                    <Icon name="save" />
                  </button>
                  <button
                    className="btn btn-warning pull-right"
                    type="button"
                    onClick={onCancelThumbnail}
                    disabled={!crop}
                  >
                    <Icon name="cancel" />
                  </button>
                </div>
                <div className="alert alert-warning">
                  <p>{I18n.t('users.edit_avatar_thumbnail.cdn_warning')}</p>
                  <p>{I18n.t('users.edit_avatar_thumbnail.cdn_explanation')}</p>
                </div>
              </div>
            )}
          </form>
          {user.avatar && (
            <>
              <h4>{I18n.t('users.edit.your_thumbnail')}</h4>
              <Popup
                content={I18n.t('users.edit.edit_thumbnail')}
                trigger={
                  <img
                    src={user.avatar.thumb_url}
                    style={{ width: '20%', height: 'auto' }}
                    onClick={startCropImage}
                  />
                }
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default UploadAvatar;
