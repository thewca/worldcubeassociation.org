import React from 'react';
import { Button, Dropdown } from 'semantic-ui-react';
import useInputState from '../../lib/hooks/useInputState';

export default function SkateholderSelector({ stakeholderList, setUserSelectedStakeholder }) {
  const [selectedOption, setSelectedOption] = useInputState(stakeholderList[0]);
  return (
    <>
      <p>
        You are part of more than one stakeholder, please select the stakeholder as which you want
        to visit the ticket page.
      </p>
      <Dropdown
        options={stakeholderList.map((requesterStakeholder) => ({
          key: requesterStakeholder.id,
          text: `${requesterStakeholder.stakeholder.name} (${requesterStakeholder.stakeholder_role})`,
          value: requesterStakeholder,
        }))}
        value={selectedOption}
        onChange={setSelectedOption}
      />
      <Button
        disabled={!selectedOption}
        onClick={() => setUserSelectedStakeholder(selectedOption)}
      >
        Select
      </Button>
    </>
  );
}
