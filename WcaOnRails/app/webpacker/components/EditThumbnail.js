import React, { useState } from "react";
import "react-image-crop/dist/ReactCrop.css";

import ReactCrop from "react-image-crop";
import { Icon } from 'semantic-ui-react';

const EditThumbnail = ({ cdnExplanation, cdnWarning, user, pending }) => {
  const [crop, setCrop] = useState();

  const handleSubmit = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();

    console.log(crop);
  };

  return (
    <form onSubmit={handleSubmit}>
      <header className="alert alert-warning">
        <p>
          {cdnExplanation}
          {cdnWarning}
        </p>
      </header>
      <section className="text-center">
        <ReactCrop
          aspect={1}
          crop={crop}
          onChange={setCrop}
          disabled={pending}
          style={{ width: "50%" }}
        >
          <img
            src={user.avatar.url}
            style={{ width: "100%", height: "auto" }}
          />
        </ReactCrop>
      </section>

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
          onClick={() => setCrop(undefined)}
          disabled={!crop}
        >
          <Icon name="cancel" />
        </button>
      </div>
    </form>
  );
};

export default EditThumbnail;
