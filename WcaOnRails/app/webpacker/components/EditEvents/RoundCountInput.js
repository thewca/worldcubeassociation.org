import React from 'react';
import { Select } from 'semantic-ui-react';
import useInputState from '../../lib/hooks/useInputState';

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

export default function RoundCountInput({ roundCount: InitialRoundCount, onChange, disabled }) {
  const [roundCount, setRoundCount] = useInputState(InitialRoundCount);

  const handleChange = (ev, data) => {
    setRoundCount(ev, data);
    onChange(roundCount);
  };

  return (
    <Select
      name="SelectRoundCount"
      value={roundCount}
      onChange={handleChange}
      disabled={disabled}
      options={RoundCountOptions}
    />
  );
}
