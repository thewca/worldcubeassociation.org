import React, { useRef, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { AvatarEdit } from "./AvatarEdit";

import "react-image-crop/dist/ReactCrop.css";

import ReactCrop from "react-image-crop";
import { CancelAndSave } from "../../elements/CancelAndSave";

// Crop starts as 25% of the original image size
const SUGGESTED_IMG_RATIO = 4;

const UploadAvatar = ({
  user,
  staff,
  translations,
  uploadDisabled,
  canRemoveAvatar,
  pending,
}) => {
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
      unit: "px",
    });
  };

  const handleSaveThumbnail = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
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
            <h3>{translations.guidelines}</h3>
            <ul>
              {translations.avatarGuidelines.map((guideline, idx) => (
                <li key={idx}>{guideline}</li>
              ))}
            </ul>
            {staff && (
              <>
                <h3>{translations.staffAvatarGuidelinesTitle}</h3>
                <ul>
                  {translations.staffAvatarGuidelines.map((guideline, idx) => (
                    <li key={idx}>{guideline}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <AvatarEdit
            translations={translations}
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
              style={{ width: "100%" }}
            >
              <img
                ref={imgRef}
                src={user.avatar.url}
                style={{ width: "100%", height: "auto" }}
              />
            </ReactCrop>

            {editingThumbnail && (
              <CancelAndSave saveDisabed={!crop} onCancel={onCancelThumbnail} />
            )}
          </form>
          {user.avatar && (
            <>
              <h4>{translations.yourThumbnail}</h4>
              <OverlayTrigger
                overlay={<Tooltip>{translations.clickToEditThumbnail}</Tooltip>}
                id="edit-thumbnail"
              >
                <img
                  src={user.avatar.thumb_url}
                  style={{ width: "20%", height: "auto" }}
                  onClick={startCropImage}
                />
              </OverlayTrigger>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default UploadAvatar;
