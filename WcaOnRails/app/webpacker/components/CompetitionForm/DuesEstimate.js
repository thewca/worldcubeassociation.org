/* eslint-disable no-unused-vars */
import React from 'react';

export default function DuesEstimate({
  country,
  currency,
  feeCents,
  compLimitEnabled,
  compLimit,
}) {
  return (
    <p className="help-block">
      <b>
        The estimated WCA Dues per competitor are $0.00 (USD)
      </b>
    </p>
  );
}
