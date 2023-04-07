import React, { useState } from "react";
import "react-image-crop/dist/ReactCrop.css";

import ReactCrop from "react-image-crop";

const EditAvatar = ({ cdnExplanation, cdnWarning, user, pending }) => {
  const [crop, setCrop] = useState();

  const handleSubmit = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();

    console.log("submit");
  };

  return (
    <form onSubmit={handleSubmit}>
      <header className="alert alert-warning">
        <p>{cdnExplanation}</p>
        <p>{cdnWarning}</p>
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

      <div>
        <button className="btn btn-primary pull-right" type="submit">
          Save
        </button>
      </div>
    </form>
  );
};

export default EditAvatar;
