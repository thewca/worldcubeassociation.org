import React, { useState } from "react";

export const AvatarEdit = ({
  translations,
  uploadDisabled,
  canRemoveAvatar,
}) => {
  const [confirmation, setConfirmation] = useState(false);
  return (
    <>
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
        <label className="form-check-label" htmlFor="guidelines-confirmation">
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
    </>
  );
};
