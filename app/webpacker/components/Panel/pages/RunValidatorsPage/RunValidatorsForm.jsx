import React, { useState } from 'react';
import {
  Form, FormField, FormGroup, Header, HeaderSubheader, Radio,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import useInputState from '../../../../lib/hooks/useInputState';
import { ALL_VALIDATORS, VALIDATORS_WITH_FIX } from '../../../../lib/wca-data.js.erb';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import CompetitionRangeSelector from './CompetitionRangeSelector';
import useCheckboxState from '../../../../lib/hooks/useCheckboxState';
import runValidatorsForCompetitionList from './api/runValidatorsForCompetitionList';
import runValidatorsForCompetitionsInRange from './api/runValidatorsForCompetitionsInRange';
import ValidationOutput from './ValidationOutput';
import WCAQueryClientProvider from '../../../../lib/providers/WCAQueryClientProvider';

const validatorNameReadable = (validatorName) => validatorName.split('::')[1];

const VALIDATOR_OPTIONS = ALL_VALIDATORS.map((validator) => ({
  key: validator,
  text: validatorNameReadable(validator),
  value: validator,
}));

const COMPETITION_SELECTION_OPTIONS_TEXT = {
  manual: 'Pick competition(s) manually',
  range: 'Competition between dates',
};

const COMPETITION_SELECTION_OPTIONS = Object.keys(COMPETITION_SELECTION_OPTIONS_TEXT);

export default function Wrapper() {
  return (
    <WCAQueryClientProvider>
      <RunValidatorsForm />
    </WCAQueryClientProvider>
  );
}

function RunValidatorsForm({ competitionIds }) {
  const [
    selectedCompetitionSelectionOption,
    setSelectedCompetitionSelectionOption,
  ] = useInputState('manual');

  const [selectedCompetitionIds, setSelectedCompetitionIds] = useInputState(competitionIds || []);
  const [selectedCompetitionRange, setSelectedCompetitionRange] = useState();
  const [validationOutput, setValidationOutput] = useState();

  const [selectedValidators, setSelectedValidators] = useInputState(ALL_VALIDATORS);
  const [applyFixWhenPossible, setApplyFixWhenPossible] = useCheckboxState(false);

  const runValidatorsForCompetitions = () => {
    if (selectedCompetitionSelectionOption === 'manual') {
      return runValidatorsForCompetitionList(
        selectedCompetitionIds,
        selectedValidators,
        applyFixWhenPossible,
      );
    }
    return runValidatorsForCompetitionsInRange(
      selectedCompetitionRange,
      selectedValidators,
      applyFixWhenPossible,
    );
  };

  const {
    mutate: runValidators,
    isPending,
    isError,
  } = useMutation({
    mutationFn: runValidatorsForCompetitions,
    onSuccess: (data) => {
      setValidationOutput(data);
    },
  });

  // enableCompetitionEditor says whether competition list editor should be enabled or not. If the
  // list of competitions is passed as parameter, then the editor need not be shown.
  const enableCompetitionEditor = !competitionIds;

  // Competition name needs to be shown on output only when the script is not ran just for a single
  // competition.
  const showCompetitionNameOnOutput = !(
    selectedCompetitionSelectionOption === 'manual'
    && selectedCompetitionIds.length === 1
  );

  return (
    <>
      <Form onSubmit={runValidators}>
        {enableCompetitionEditor && (
          <>
            <Header>Competition Selector</Header>
            <FormGroup grouped>
              {COMPETITION_SELECTION_OPTIONS.map((key) => (
                <FormField key={key}>
                  <Radio
                    label={COMPETITION_SELECTION_OPTIONS_TEXT[key]}
                    name="competitionSelectionOption"
                    value={key}
                    checked={selectedCompetitionSelectionOption === key}
                    onChange={setSelectedCompetitionSelectionOption}
                  />
                </FormField>
              ))}
            </FormGroup>
            {(
              selectedCompetitionSelectionOption === 'manual'
            ) && (
              <Form.Field
                label="Competition ID(s)"
                control={IdWcaSearch}
                name="competitionIds"
                value={selectedCompetitionIds}
                onChange={setSelectedCompetitionIds}
                model={SEARCH_MODELS.competition}
                multiple
                required
              />
            )}
            {(
              selectedCompetitionSelectionOption === 'range'
            ) && (
              <CompetitionRangeSelector
                range={selectedCompetitionRange}
                setRange={setSelectedCompetitionRange}
              />
            )}
          </>
        )}
        <Header>Run Validators</Header>
        <Form.Dropdown
          label="Select Validators to run"
          options={VALIDATOR_OPTIONS}
          fluid
          multiple
          selection
          value={selectedValidators}
          onChange={setSelectedValidators}
        />
        <Form.Checkbox
          label="Apply fix when possible"
          value={applyFixWhenPossible}
          onChange={setApplyFixWhenPossible}
        />
        <Header as="h4">
          <HeaderSubheader>
            {`List of validators with automated fix: ${
              VALIDATORS_WITH_FIX.map(validatorNameReadable).join(', ')
            }`}
          </HeaderSubheader>
        </Header>
        <Form.Button type="submit">Run Validators</Form.Button>
      </Form>
      <ValidationOutput
        validationOutput={validationOutput}
        isPending={isPending}
        isError={isError}
        showCompetitionNameOnOutput={showCompetitionNameOnOutput}
      />
    </>
  );
}
