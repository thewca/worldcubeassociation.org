import React from 'react';
import { Dropdown, Select } from 'semantic-ui-react';

const RoundCountOptions = [
  { key: 0, value: 0, text: '# of Rounds?' },
  {
    key: -1, value: -1, text: '────────', disabled: true,
  },
  { key: 1, value: 1, text: '1 round' },
  { key: 2, value: 2, text: '2 rounds' },
  { key: 3, value: 3, text: '3 rounds' },
  { key: 4, value: 4, text: '4 rounds' },
];

/**
 * Renders a select input for the number of rounds.
 * @Component
 * @param {number} roundCount - the current round count
 * @param {function(number)} onChange - the callback to call when the round count changes
 * @param {boolean} disabled - whether the input is disabled
 * @returns {JSX.Element} the rendered component
 */
export default function RoundCountInput({ roundCount, onChange, disabled }) {
  const handleChange = (ev, data) => onChange(data.value);

  return (
    <Dropdown
      selection
      compact
      name="SelectRoundCount"
      value={roundCount}
      onChange={handleChange}
      disabled={disabled}
      options={RoundCountOptions}
      style={{
        fontSize: '.75em',
      }}
    />
  );
}
