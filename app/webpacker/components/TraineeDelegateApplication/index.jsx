import React, { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Container,
  Form,
  Header,
  List,
  Message,
  Segment,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import _ from 'lodash';
import I18n from '../../lib/i18n';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import { regulationsUrl } from '../../lib/requests/routes.js.erb';
import { useInputUpdater } from '../../lib/hooks/useInputState';
import { useCheckboxUpdater } from '../../lib/hooks/useCheckboxState';
import FormObjectProvider, {
  useFormContext,
  useFormErrorHandler,
  useFormObject,
  useFormObjectState,
  useFormUpdateAction,
} from '../wca/FormBuilder/provider/FormObjectProvider';
import FormErrors from '../wca/FormBuilder/FormErrors';
import EligibilityMessage from './EligibilityMessage';
import submitTraineeDelegateApplication from './api/submitTraineeDelegateApplication';

// i18n-tasks-use t('trainee_delegate_application.form.declaration_read_regulations_html')

const DECLARATIONS = [
  'understands_application',
  'has_delegate_support',
  'proficient_in_english',
  'read_regulations',
];

const DECLARATIONS_SECTION = ['declarations'];

const REQUIRED_ANSWERS = [
  'introduction',
  'competition_contributions',
  'motivation',
  'relevant_skills',
];

const EMPTY_APPLICATION = {
  delegate_region_id: null,
  spoken_to_delegate_ids: [],
  recommender_ids: [],
  introduction: '',
  competition_contributions: '',
  volunteer_history: '',
  motivation: '',
  relevant_skills: '',
  is_involved_in_cubing_business: null,
  cubing_business_involvement_details: '',
  declarations: Object.fromEntries(DECLARATIONS.map((declaration) => [declaration, false])),
};

function DeclarationCheckbox({ declaration, label }) {
  const [isAcknowledged, setIsAcknowledgedRaw] = useFormObjectState(
    declaration,
    DECLARATIONS_SECTION,
  );
  const setIsAcknowledged = useCheckboxUpdater(setIsAcknowledgedRaw);

  return (
    <Form.Checkbox
      required
      id={declaration}
      checked={isAcknowledged}
      label={label}
      onChange={setIsAcknowledged}
    />
  );
}

function AnswerTextArea({ answer, label, required = false }) {
  const [value, setValueRaw] = useFormObjectState(answer);
  const setValue = useInputUpdater(setValueRaw);

  return (
    <Form.TextArea
      required={required}
      id={answer}
      name={answer}
      label={label}
      value={value}
      onChange={setValue}
    />
  );
}

function DelegateDropdown({
  field,
  label,
  options,
  disabled,
}) {
  const [delegateIds, setDelegateIdsRaw] = useFormObjectState(field);
  const setDelegateIds = useInputUpdater(setDelegateIdsRaw);

  return (
    <Form.Dropdown
      required
      fluid
      multiple
      selection
      search
      disabled={disabled}
      name={field}
      label={label}
      placeholder={I18n.t('trainee_delegate_application.form.delegates_placeholder')}
      value={delegateIds}
      options={options}
      onChange={setDelegateIds}
    />
  );
}

export default function Wrapper({
  applicant,
  eligibilityIssues,
  minimumAge,
  delegateRegions,
  volunteerRoleHistory,
}) {
  return (
    <FormObjectProvider initialObject={EMPTY_APPLICATION}>
      <TraineeDelegateApplication
        applicant={applicant}
        eligibilityIssues={eligibilityIssues}
        minimumAge={minimumAge}
        delegateRegions={delegateRegions}
        volunteerRoleHistory={volunteerRoleHistory}
      />
    </FormObjectProvider>
  );
}

function TraineeDelegateApplication({
  applicant,
  eligibilityIssues,
  minimumAge,
  delegateRegions,
  volunteerRoleHistory,
}) {
  const application = useFormObject();
  const updateFormValue = useFormUpdateAction();
  const { errors } = useFormContext();
  const onError = useFormErrorHandler();

  // Not submitted: the top-level region only narrows down the subregion choice.
  const [rootRegionId, setRootRegionId] = useState(null);

  const [isInvolvedInBusiness, setIsInvolvedInBusinessRaw] = useFormObjectState(
    'is_involved_in_cubing_business',
  );
  const setIsInvolvedInBusiness = useInputUpdater(setIsInvolvedInBusinessRaw);

  const {
    mutate: submitApplication,
    isPending,
    isSuccess,
  } = useMutation({ mutationFn: submitTraineeDelegateApplication, onError });

  const rootRegionOptions = useMemo(
    () => _.uniqBy(delegateRegions, 'root_id').map((region) => ({
      key: region.root_id,
      value: region.root_id,
      text: region.root_name,
      disabled: !delegateRegions.some((candidate) => (
        candidate.root_id === region.root_id && candidate.reviewer_name
      )),
    })),
    [delegateRegions],
  );

  const subregionOptions = useMemo(
    () => delegateRegions
      .filter((region) => region.root_id === rootRegionId && region.id !== rootRegionId)
      .map((region) => ({
        key: region.id,
        value: region.id,
        text: region.name,
        disabled: !region.reviewer_name,
      })),
    [delegateRegions, rootRegionId],
  );

  const selectedRegion = useMemo(
    () => delegateRegions.find((region) => region.id === application.delegate_region_id),
    [delegateRegions, application.delegate_region_id],
  );

  const delegateOptions = useMemo(
    () => (selectedRegion?.junior_and_full_delegates ?? []).map((delegate) => ({
      key: delegate.id,
      value: delegate.id,
      text: `${delegate.name} - ${I18n.t(`enums.user_roles.status.delegate_regions.${delegate.status}`)}`,
    })),
    [selectedRegion],
  );

  const isApplicationComplete = selectedRegion
    && application.spoken_to_delegate_ids.length > 0
    && application.recommender_ids.length > 0
    && REQUIRED_ANSWERS.every((answer) => application[answer].trim())
    && DECLARATIONS.every((declaration) => application.declarations[declaration])
    && application.is_involved_in_cubing_business !== null
    && (!application.is_involved_in_cubing_business
      || application.cubing_business_involvement_details.trim());

  // The selected Delegates belong to the previous region, so they have to be picked again.
  const selectRegion = useCallback((regionId) => {
    updateFormValue('delegate_region_id', regionId);
    updateFormValue('spoken_to_delegate_ids', []);
    updateFormValue('recommender_ids', []);
  }, [updateFormValue]);

  const updateRootRegion = useCallback((_event, { value }) => {
    setRootRegionId(value);
    // A top-level region without subregions is directly the region the applicant lives in.
    const isLeafRegion = delegateRegions.some((region) => region.id === value);
    selectRegion(isLeafRegion ? value : null);
  }, [delegateRegions, selectRegion]);

  const updateSubregion = useCallback((_event, { value }) => selectRegion(value), [selectRegion]);

  const submit = useCallback(
    () => submitApplication(application),
    [submitApplication, application],
  );

  if (eligibilityIssues.length > 0) {
    return (
      <Container text>
        <Header as="h1">{I18n.t('trainee_delegate_application.title')}</Header>
        <EligibilityMessage issues={eligibilityIssues} minimumAge={minimumAge} />
      </Container>
    );
  }

  if (isSuccess) {
    return (
      <Container text>
        <Header as="h1">{I18n.t('trainee_delegate_application.title')}</Header>
        <Message positive>
          <Message.Header>{I18n.t('trainee_delegate_application.success_title')}</Message.Header>
          <p>{I18n.t('trainee_delegate_application.success')}</p>
        </Message>
      </Container>
    );
  }

  return (
    <Container text>
      <Header as="h1">{I18n.t('trainee_delegate_application.title')}</Header>
      <p>{I18n.t('trainee_delegate_application.introduction')}</p>

      <Header as="h2">{I18n.t('trainee_delegate_application.form.declaration_and_basic_information')}</Header>
      <Segment>
        <List>
          <List.Item>
            <strong>{`${I18n.t('trainee_delegate_application.form.name')}:`}</strong>
            {' '}
            {applicant.name}
          </List.Item>
          <List.Item>
            <strong>{`${I18n.t('trainee_delegate_application.form.wca_id')}:`}</strong>
            {' '}
            {applicant.wca_id}
          </List.Item>
          <List.Item>
            <strong>{`${I18n.t('trainee_delegate_application.form.email')}:`}</strong>
            {' '}
            {applicant.email}
          </List.Item>
          <List.Item>
            <strong>{`${I18n.t('trainee_delegate_application.form.age')}:`}</strong>
            {' '}
            {applicant.age}
          </List.Item>
          <List.Item>
            <strong>{`${I18n.t('trainee_delegate_application.form.competition_count')}:`}</strong>
            {' '}
            {applicant.competition_count}
          </List.Item>
        </List>
      </Segment>

      <FormErrors errors={errors} />

      <Form onSubmit={submit} loading={isPending}>
        <DeclarationCheckbox
          declaration="understands_application"
          label={I18n.t('trainee_delegate_application.form.declaration_understands_application')}
        />
        <DeclarationCheckbox
          declaration="proficient_in_english"
          label={I18n.t('trainee_delegate_application.form.declaration_proficient_in_english')}
        />
        <DeclarationCheckbox
          declaration="read_regulations"
          label={{
            children: (
              <I18nHTMLTranslate
                i18nKey="trainee_delegate_application.form.declaration_read_regulations_html"
                options={{ regulations_url: regulationsUrl }}
              />
            ),
          }}
        />
        <p>{I18n.t('trainee_delegate_application.form.regulations_note')}</p>

        <Header as="h2">{I18n.t('trainee_delegate_application.form.region_and_references')}</Header>
        <Form.Dropdown
          required
          fluid
          selection
          search
          name="root_region_id"
          label={I18n.t('trainee_delegate_application.form.region')}
          placeholder={I18n.t('trainee_delegate_application.form.region_placeholder')}
          value={rootRegionId}
          options={rootRegionOptions}
          onChange={updateRootRegion}
        />
        {subregionOptions.length > 0 && (
          <Form.Dropdown
            required
            fluid
            selection
            search
            name="delegate_region_id"
            label={I18n.t('trainee_delegate_application.form.subregion')}
            placeholder={I18n.t('trainee_delegate_application.form.subregion_placeholder')}
            value={application.delegate_region_id}
            options={subregionOptions}
            onChange={updateSubregion}
          />
        )}
        {selectedRegion && (
          <Message>
            <strong>
              {`${I18n.t('trainee_delegate_application.form.reviewing_delegate')}:`}
            </strong>
            {' '}
            {selectedRegion.reviewer_name}
          </Message>
        )}
        <DelegateDropdown
          field="spoken_to_delegate_ids"
          label={I18n.t('trainee_delegate_application.form.spoken_delegates')}
          options={delegateOptions}
          disabled={!selectedRegion}
        />
        <DeclarationCheckbox
          declaration="has_delegate_support"
          label={I18n.t('trainee_delegate_application.form.declaration_has_delegate_support')}
        />
        <DelegateDropdown
          field="recommender_ids"
          label={I18n.t('trainee_delegate_application.form.recommenders')}
          options={delegateOptions}
          disabled={!selectedRegion || !application.declarations.has_delegate_support}
        />

        <Header as="h2">{I18n.t('trainee_delegate_application.form.experience_and_motivation')}</Header>
        <AnswerTextArea
          required
          answer="introduction"
          label={I18n.t('trainee_delegate_application.form.introduction')}
        />
        <AnswerTextArea
          required
          answer="competition_contributions"
          label={I18n.t('trainee_delegate_application.form.competition_contributions')}
        />

        <Form.Field>
          <label htmlFor="volunteer_history">
            {I18n.t('trainee_delegate_application.form.volunteer_history')}
          </label>
          <Message content={I18n.t('trainee_delegate_application.form.role_history_warning')} />
          {volunteerRoleHistory.length > 0 && (
            <Segment>
              <List divided relaxed>
                {volunteerRoleHistory.map((role) => (
                  <List.Item key={role.id}>
                    <List.Content>
                      <List.Header>{role.title}</List.Header>
                      <List.Description>
                        {/* Roles without an end date are still ongoing. */}
                        {`${role.start_date} - ${role.end_date ?? I18n.t('trainee_delegate_application.form.present')}`}
                      </List.Description>
                    </List.Content>
                  </List.Item>
                ))}
              </List>
            </Segment>
          )}
          <AnswerTextArea answer="volunteer_history" />
        </Form.Field>

        <AnswerTextArea
          required
          answer="motivation"
          label={I18n.t('trainee_delegate_application.form.motivation')}
        />
        <AnswerTextArea
          required
          answer="relevant_skills"
          label={I18n.t('trainee_delegate_application.form.relevant_skills')}
        />

        <Form.Field required>
          <label htmlFor="is_involved_in_cubing_business_yes">
            {I18n.t('trainee_delegate_application.form.cubing_business_involvement')}
          </label>
          <Form.Group inline>
            <Form.Radio
              id="is_involved_in_cubing_business_yes"
              name="is_involved_in_cubing_business"
              value
              checked={isInvolvedInBusiness === true}
              label={I18n.t('trainee_delegate_application.form.yes')}
              onChange={setIsInvolvedInBusiness}
            />
            <Form.Radio
              id="is_involved_in_cubing_business_no"
              name="is_involved_in_cubing_business"
              value={false}
              checked={isInvolvedInBusiness === false}
              label={I18n.t('trainee_delegate_application.form.no')}
              onChange={setIsInvolvedInBusiness}
            />
          </Form.Group>
        </Form.Field>
        {isInvolvedInBusiness && (
          <AnswerTextArea
            required
            answer="cubing_business_involvement_details"
            label={I18n.t('trainee_delegate_application.form.cubing_business_involvement_details')}
          />
        )}

        <Button primary type="submit" disabled={!isApplicationComplete || isPending}>
          {I18n.t('trainee_delegate_application.form.submit')}
        </Button>
      </Form>
    </Container>
  );
}
