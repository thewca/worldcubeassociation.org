import React, { useState } from "react";

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
          <div>
            <label htmlFor="send-new-avatar" className="form-label">
              {translations.sendNewAvatar}
            </label>
            <input className="form-control" type="file" id="send-new-avatar" />
          </div>
          <p className="text-muted">{translations.afterAvatarUpload}</p>
          <div className="form-check">
            <input
              className="form-check-input"
              value={confirmation}
              type="checkbox"
              id="guidelines-confirmation"
              onChange={() => setConfirmation((old) => !old)}
              disabled={uploadDisabled}
            />
            &nbsp;
            <label
              className="form-check-label"
              htmlFor="guidelines-confirmation"
            >
              {translations.guidelinesConfirmation}
            </label>
          </div>
          <div>
            <button className="btn btn-primary">{translations.save}</button>
            {!!canRemoveAvatar && (
              <button className="btn btn-danger">
                {translations.removeAvatar}
              </button>
            )}
          </div>
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
