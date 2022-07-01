import React from 'react';

import formats from '../../../../lib/wca-data/formats.js.erb';

export default function CutoffFormatInput({ cutoffFormats, cutoff, onChange }) {
  return (
    <div className="col-sm-9">
      <div className="input-group">
        <select
          value={cutoff}
          onChange={onChange}
          className="form-control"
          id="cutoff-round-format-input"
        >
          <option value={0}>No cutoff</option>
          {cutoffFormats.length > 0 && (<option disabled="disabled">────────</option>)}
          {cutoffFormats.map((format) => (
            <option key={format} value={+format}>
              Best of
              {' '}
              {format}
            </option>
          ))}
        </select>
        <div className="input-group-addon">
          <strong>
            /
            {' '}
            {formats.byId[cutoff].name}
          </strong>
        </div>
      </div>
    </div>
  );
}
