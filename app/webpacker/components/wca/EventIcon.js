import React from 'react';
import classnames from 'classnames';

/* eslint react/jsx-props-no-spreading: "off" */
function EventIcon({
  id, className, size = undefined, ...other
}) {
  return (
    <span
      {...other}
      className={classnames('cubing-icon', `event-${id}`, className)}
      style={{ fontSize: size }}
    />
  );
}

export default EventIcon;
