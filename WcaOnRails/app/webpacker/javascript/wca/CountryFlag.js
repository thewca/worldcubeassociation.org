import React from 'react';
import classnames from 'classnames';

/* eslint react/jsx-props-no-spreading: "off" */
const CountryFlag = ({ iso2, className, ...other }) => (
  <span
    {...other}
    className={classnames('flag-icon', `flag-icon-${iso2.toLowerCase()}`, className)}
  />
);

export default CountryFlag;
