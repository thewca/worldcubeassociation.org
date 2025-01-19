import React, { useState } from 'react';
import {
  Form, FormField, FormGroup, Header, Radio,
} from 'semantic-ui-react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import useInputState from '../../../../lib/hooks/useInputState';
import { ALL_VALIDATORS, VALIDATORS_WITH_FIX } from '../../../../lib/wca-data.js.erb';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import CompetitionRangeSelector from './CompetitionRangeSelector';
import useCheckboxState from '../../../../lib/hooks/useCheckboxState';
import runValidatorsForCompetitionList from './api/runValidatorsForCompetitionList';
import runValidatorsForCompetitionsInRange from './api/runValidatorsForCompetitionsInRange';
import ValidationOutput from './ValidationOutput';

const validatorNameReadable = (validatorName) => validatorName.split('::')[1];

const VALIDATOR_OPTIONS = ALL_VALIDATORS.map((validator) => ({
  key: validator,
  text: validatorNameReadable(validator),
  value: validator,
}));

const COMPETITION_SELECTION_OPTIONS_MAP = {
  manual: {
    key: 'manual',
    text: 'Pick competition(s) manually',
  },
  range: {
    key: 'range',
    text: 'Competition between dates',
  },
};

const COMPETITION_SELECTION_OPTIONS = [
  COMPETITION_SELECTION_OPTIONS_MAP.manual.key,
  COMPETITION_SELECTION_OPTIONS_MAP.range.key,
];

const RUN_VALIDATORS_QUERY_CLIENT = new QueryClient();

export default function RunValidatorsForm({ competitionIds }) {
  const [
    selectedCompetitionSelectionOption,
    setSelectedCompetitionSelectionOption,
  ] = useInputState(COMPETITION_SELECTION_OPTIONS_MAP.manual.key);

  const [selectedCompetitionIds, setSelectedCompetitionIds] = useInputState(competitionIds || []);
  const [selectedCompetitionRange, setSelectedCompetitionRange] = useState();

  const [selectedValidators, setSelectedValidators] = useInputState(ALL_VALIDATORS);
  const [applyFixWhenPossible, setApplyFixWhenPossible] = useCheckboxState(false);

  const runValidatorsForCompetitions = () => {
    if (selectedCompetitionSelectionOption === COMPETITION_SELECTION_OPTIONS_MAP.manual.key) {
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
    data: validationOutput, isFetching, isError, refetch: runValidators,
  } = useQuery({
    queryKey: ['competitionCountInRange'],
    queryFn: runValidatorsForCompetitions,
    enabled: false,
  }, RUN_VALIDATORS_QUERY_CLIENT);

  // enableCompetitionEditor says whether competition list editor should be enabled or not. If the
  // list of competitions is passed as parameter, then the editor need not be shown.
  const enableCompetitionEditor = !competitionIds;

  // Competition name needs to be shown on output only when the script is not ran just for a single
  // competition.
  const showCompetitionNameOnOutput = !(
    selectedCompetitionSelectionOption === COMPETITION_SELECTION_OPTIONS_MAP.manual.key
    && selectedCompetitionIds.length === 1
  );

  return (
    <>
      <Form onSubmit={runValidators}>
        {enableCompetitionEditor && (
          <>
            <Header>Competition Selector</Header>
            <FormGroup grouped>
              {COMPETITION_SELECTION_OPTIONS.map((option) => (
                <FormField key={option}>
                  <Radio
                    label={COMPETITION_SELECTION_OPTIONS_MAP[option].text}
                    name="competitionSelectionOption"
                    value={option}
                    checked={selectedCompetitionSelectionOption === option}
                    onChange={setSelectedCompetitionSelectionOption}
                  />
                </FormField>
              ))}
            </FormGroup>
            {(
              selectedCompetitionSelectionOption === COMPETITION_SELECTION_OPTIONS_MAP.manual.key
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
              selectedCompetitionSelectionOption === COMPETITION_SELECTION_OPTIONS_MAP.range.key
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
          label={`Apply fix when possible (List of validators with automated fix: ${
            VALIDATORS_WITH_FIX.map(validatorNameReadable).join(', ')
          })`}
          value={applyFixWhenPossible}
          onChange={setApplyFixWhenPossible}
        />
        <Form.Button type="submit">Run Validators</Form.Button>
      </Form>
      <ValidationOutput
        validationOutput={validationOutput}
        isFetching={isFetching}
        isError={isError}
        showCompetitionNameOnOutput={showCompetitionNameOnOutput}
      />
    </>
  );
}
