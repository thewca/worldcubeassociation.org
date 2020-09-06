import React from 'react';
import ReactDOM from 'react-dom';

export const registerComponent = (Component, name) => {
  if (Object.prototype.hasOwnProperty.call(window.wca.components, name)) {
    /* eslint-disable-next-line */
    console.error(`Component '${name}' already registered!`);
    return;
  }
  window.wca.components[name] = (elemId, options = {}) => {
    // Yes, we do want props spreading here, as we don't now what options a
    // component may use!
    /* eslint-disable react/jsx-props-no-spreading */
    ReactDOM.render(
      <Component {...options} />,
      document.getElementById(elemId),
    );
  };
};

export const attachComponentToElem = (name, elemId, options) => {
  if (!Object.prototype.hasOwnProperty.call(window.wca.components, name)) {
    // FIXME: a proper error targeted to developers, indicating they probably
    // forgot to use "add_to_packs" with the component's pack.
    /* eslint-disable-next-line */
    console.error(`Component '${name}' is not registered!`);
    return;
  }
  window.wca.components[name](elemId, options);
};
