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

const VALIDATOR_OPTIONS = ALL_VALIDATORS.map((validator) => ({
  key: validator,
  text: validator,
  value: validator,
}));

const COMPETITION_SELECTION_OPTIONS_TEXT = {
  manual: 'Pick competition(s) manually',
  range: 'Competitions between dates',
};

const COMPETITION_SELECTION_OPTIONS = Object.keys(COMPETITION_SELECTION_OPTIONS_TEXT);

export default function RunValidatorsForm({ competitionIds }) {
  const [competitionSelectionMode, setCompetitionSelectionMode] = useInputState('manual');

  const [selectedCompetitionIds, setSelectedCompetitionIds] = useInputState(competitionIds || []);
  const [selectedCompetitionRange, setSelectedCompetitionRange] = useState();

  const [selectedValidators, setSelectedValidators] = useInputState(ALL_VALIDATORS);
  const [applyFixWhenPossible, setApplyFixWhenPossible] = useCheckboxState(false);

  const runValidatorsForCompetitions = () => {
    if (competitionSelectionMode === 'manual') {
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
    error,
    data: validationOutput,
  } = useMutation({
    mutationFn: runValidatorsForCompetitions,
  });

  // enableCompetitionEditor says whether competition list editor should be enabled or not. If the
  // list of competitions is passed as parameter, then the editor need not be shown.
  const enableCompetitionEditor = !competitionIds;

  // Competition name needs to be shown on output only when the script is ran for a range of
  // competitions.
  const showCompetitionNameOnOutput = competitionSelectionMode === 'range' || selectedCompetitionIds.length > 1;

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
                    checked={competitionSelectionMode === key}
                    onChange={setCompetitionSelectionMode}
                  />
                </FormField>
              ))}
            </FormGroup>
            {competitionSelectionMode === 'manual' && (
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
            {competitionSelectionMode === 'range' && (
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
            {`List of validators with automated fix: ${VALIDATORS_WITH_FIX.join(', ')}`}
          </HeaderSubheader>
        </Header>
        <Form.Button
          type="submit"
          disabled={selectedValidators.length === 0}
        >
          Run Validators
        </Form.Button>
      </Form>
      <ValidationOutput
        validationOutput={validationOutput}
        isPending={isPending}
        isError={isError}
        error={error}
        showCompetitionNameOnOutput={showCompetitionNameOnOutput}
      />
    </>
  );
}
