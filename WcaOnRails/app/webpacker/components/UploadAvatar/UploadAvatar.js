import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { AvatarEdit } from "./AvatarEdit";

const UploadAvatar = ({
  user,
  staff,
  translations,
  uploadDisabled,
  canRemoveAvatar,
}) => {
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
          <img
            src={user.avatar.url}
            style={{ width: "100%", height: "auto" }}
          />
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
