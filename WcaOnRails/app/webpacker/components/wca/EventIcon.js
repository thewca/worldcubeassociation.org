import React from 'react';
import classnames from 'classnames';

/* eslint react/jsx-props-no-spreading: "off" */
function EventIcon({ id, className, ...other }) {
  return (
    <span
      {...other}
      className={classnames('cubing-icon', `event-${id}`, className)}
    />
  );
}

export default EventIcon;
