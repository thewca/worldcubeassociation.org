import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import classnames from 'classnames';
import Country from './countries.js.erb';

const tooltipSettings = (tooltipText) => (
  <Tooltip id="resultCountryFlagTooptip">
    {tooltipText}
  </Tooltip>
);

/* eslint react/jsx-props-no-spreading: "off" */
const CountryFlag = ({ iso2, className, ...other }) => (
  <OverlayTrigger overlay={tooltipSettings(Country.find((country) => country.iso2 === iso2).name)} placement="top">
    <span {...other} className={classnames('flag-icon', `flag-icon-${iso2.toLowerCase()}`, className)} />
  </OverlayTrigger>
);

export default CountryFlag;
