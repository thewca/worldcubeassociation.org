import React, { useState } from "react";
import { AvatarEdit } from "./AvatarEdit";

const UploadAvatar = ({
  user,
  staff,
  translations,
  uploadDisabled,
  canRemoveAvatar,
}) => {
  const [confirmation, setConfirmation] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
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
          <img src={user.avatar.url} style={{ width: "60%", height: "auto" }} />
          {user.avatar && (
            <>
              <h4>{translations.yourThumbnail}</h4>
              <a href={`/users/${user.id}/edit/avatar_thumbnail`}>
                <img
                  src={user.avatar.thumb_url}
                  style={{ width: "10%", height: "auto" }}
                />
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default UploadAvatar;
