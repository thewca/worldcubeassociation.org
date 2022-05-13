import React from 'react';
import classnames from 'classnames';

/* eslint react/jsx-props-no-spreading: "off" */
const EventIcon = ({ id, className, ...other }) => (
  <span
    {...other}
    className={classnames('cubing-icon', `event-${id}`, className)}
  />
);

export default EventIcon;
