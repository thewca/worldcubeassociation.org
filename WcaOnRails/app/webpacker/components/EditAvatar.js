import React from "react";

const EditAvatar = ({ cdn_explanation, cdn_warning }) => {
  return (
    <div>
      <header className="alert alert-warning">
        <p>{cdn_explanation}</p>
        <p>{cdn_warning}</p>
      </header>
    </div>
  );
};

export default EditAvatar;
