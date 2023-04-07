import React from "react";

const EditAvatar = ({ cdn_explanation, cdn_warning, user }) => {
  return (
    <div>
      <header className="alert alert-warning">
        <p>{cdn_explanation}</p>
        <p>{cdn_warning}</p>
      </header>
      <section className="text-center">
        <img src={user.avatar.url} style={{ width: "50%", height: "auto" }} />
      </section>
    </div>
  );
};

export default EditAvatar;
