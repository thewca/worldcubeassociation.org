import React, { useState } from 'react';
import I18n from '../../lib/i18n';

function AvatarEdit({
  uploadDisabled,
  canRemoveAvatar,
}) {
  const [confirmation, setConfirmation] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [reasonForRemoval, setReasonForRemoval] = useState('');

  return (
    <>
      <div>
        <label htmlFor="send-new-avatar" className="form-label">
          {I18n.t('activerecord.attributes.user.pending_avatar')}
        </label>
        <input className="form-control" type="file" id="send-new-avatar" />
      </div>
      <p className="text-muted">{I18n.t('simple_form.hints.user.pending_avatar')}</p>
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
          {I18n.t('users.edit.guidelines_confirmation')}
        </label>
      </div>
      <div>
        <button className="btn btn-primary">{I18n.t('users.edit.save')}</button>
        {!!canRemoveAvatar && (
          <button
            className="btn btn-danger"
            onClick={() => setIsRemoving((old) => !old)}
          >
            {I18n.t('users.edit.remove_avatar')}
          </button>
        )}
        {isRemoving && (
          <div className="form-group">
            <textarea
              className="form-control"
              placeholder={I18n.t('users.edit.remove_avatar_reason')}
              value={reasonForRemoval}
              onChange={(evt) => setReasonForRemoval(evt.target.value)}
            />
            <button className="btn btn-danger">
              {I18n.t('users.edit.remove_avatar_confirm_button')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default AvatarEdit;
