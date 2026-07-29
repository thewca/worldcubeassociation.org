import React from 'react';
import classnames from 'classnames';

/* eslint react/jsx-props-no-spreading: "off" */
function EventIcon({
  id, className, size = undefined, hoverable = true, ...other
}) {
  const resetHoverable = hoverable ? {} : { pointerEvents: 'none' };
  return (
    <span
      {...other}
      className={classnames('cubing-icon', `event-${id}`, className)}
      style={{ fontSize: size, ...resetHoverable }}
    />
  );
}

export default EventIcon;
