import React, { useMemo } from 'react';
import { Form, Label } from 'semantic-ui-react';

import formats from '../../../../lib/wca-data/formats.js.erb';

const BaseCutoffOptions = [
  { key: 0, value: 0, text: 'No cutoff' },
  {
    key: -1, value: -1, text: '────────', disabled: true,
  },
];

export function CutoffFormatInput({
  cutoffFormats, cutoffFormat, onChange,
}) {
  const cutoffFormatOptions = useMemo(() => (cutoffFormats.length > 0
    // Otherwise, show the BaseCutoffSelectOptions and the formatted cutoff options
    ? BaseCutoffOptions.concat(cutoffFormats.map((format) => ({
      value: parseInt(format, 10),
      text: `Best of ${format}`,
    })))
    // If there are no cutoff options availabe, just show the "No cutoff" option
    : BaseCutoffOptions.filter(({ value }) => value > 0)
  ), [cutoffFormats]);

  return (
    <Form.Select
      value={cutoffFormat}
      onChange={onChange}
      options={cutoffFormatOptions}
    />
  );
}

/**
 * @Example "/ Average of 5"
 */
export function CutoffFormatLabel({ format }) {
  return (
    <Label pointing>
      <strong>
        /
        {' '}
        {formats.byId[format].name}
      </strong>
    </Label>
  );
}

export default function CutoffFormatField({
  cutoffFormats, wcifRound, cutoffFormat, onChange,
}) {
  return (
    <Form.Field inline>
      <Form.Input
        as={CutoffFormatInput}
        cutoffFormats={cutoffFormats}
        cutoffFormat={cutoffFormat}
        onChange={onChange}
      />
      <CutoffFormatLabel format={wcifRound.format} />
    </Form.Field>
  );
}
