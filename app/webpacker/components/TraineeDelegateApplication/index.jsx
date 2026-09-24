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
import EligibilityMessage from './EligibilityMessage';
import submitTraineeDelegateApplication from './api/submitTraineeDelegateApplication';

const DECLARATIONS = [
  'understands_application',
  'has_delegate_support',
  'proficient_in_english',
  'read_regulations',
];

const REQUIRED_ANSWERS = [
  'introduction',
  'competition_contributions',
  'motivation',
  'relevant_skills',
];

const EMPTY_APPLICATION = {
  delegate_region_id: null,
  spoken_to_delegate_user_ids: [],
  recommender_user_ids: [],
  introduction: '',
  competition_contributions: '',
  volunteer_history: '',
  motivation: '',
  relevant_skills: '',
  cubing_business_involvement: null,
  cubing_business_involvement_details: '',
  declarations: Object.fromEntries(DECLARATIONS.map((declaration) => [declaration, false])),
};

export default function TraineeDelegateApplication({
  applicant,
  eligibilityIssues,
  minimumAge,
  delegateRegions,
  volunteerRoleHistory,
}) {
  const [application, setApplication] = useState(EMPTY_APPLICATION);
  const [rootRegionId, setRootRegionId] = useState(null);

  const {
    mutate: submitApplication,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({ mutationFn: submitTraineeDelegateApplication });

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
    && application.spoken_to_delegate_user_ids.length > 0
    && application.recommender_user_ids.length > 0
    && REQUIRED_ANSWERS.every((answer) => application[answer].trim())
    && DECLARATIONS.every((declaration) => application.declarations[declaration])
    && application.cubing_business_involvement !== null
    && (!application.cubing_business_involvement
      || application.cubing_business_involvement_details.trim());

  const updateField = useCallback((_event, { name, value }) => {
    setApplication((current) => ({ ...current, [name]: value }));
  }, []);

  const updateDeclaration = useCallback((_event, { name, checked }) => {
    setApplication((current) => ({
      ...current,
      declarations: { ...current.declarations, [name]: checked },
    }));
  }, []);

  const updateRootRegion = useCallback((_event, { value }) => {
    setRootRegionId(value);
    // A top-level region without subregions is directly the region the applicant lives in.
    const isLeafRegion = delegateRegions.some((region) => region.id === value);
    setApplication((current) => ({
      ...current,
      delegate_region_id: isLeafRegion ? value : null,
      spoken_to_delegate_user_ids: [],
      recommender_user_ids: [],
    }));
  }, [delegateRegions]);

  const updateSubregion = useCallback((_event, { value }) => {
    setApplication((current) => ({
      ...current,
      delegate_region_id: value,
      spoken_to_delegate_user_ids: [],
      recommender_user_ids: [],
    }));
  }, []);

  const submit = useCallback(() => submitApplication(application), [submitApplication, application]);

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

      {isError && (
        // Errors that don't come from our own validation (e.g. a network failure) have no `errors` list.
        <Message negative list={error.json?.errors ?? [error.message]} />
      )}

      <Form onSubmit={submit} loading={isPending}>
        <Form.Checkbox
          required
          name="understands_application"
          checked={application.declarations.understands_application}
          label={I18n.t('trainee_delegate_application.form.declaration_understands_application')}
          onChange={updateDeclaration}
        />
        <Form.Checkbox
          required
          name="proficient_in_english"
          checked={application.declarations.proficient_in_english}
          label={I18n.t('trainee_delegate_application.form.declaration_proficient_in_english')}
          onChange={updateDeclaration}
        />
        <Form.Checkbox
          required
          id="read_regulations"
          name="read_regulations"
          checked={application.declarations.read_regulations}
          label={(
            <label htmlFor="read_regulations">
              <I18nHTMLTranslate
                i18nKey="trainee_delegate_application.form.declaration_read_regulations_html"
                options={{ regulations_url: regulationsUrl }}
              />
            </label>
          )}
          onChange={updateDeclaration}
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
        <Form.Dropdown
          required
          fluid
          multiple
          selection
          search
          disabled={!selectedRegion}
          name="spoken_to_delegate_user_ids"
          label={I18n.t('trainee_delegate_application.form.spoken_delegates')}
          placeholder={I18n.t('trainee_delegate_application.form.delegates_placeholder')}
          value={application.spoken_to_delegate_user_ids}
          options={delegateOptions}
          onChange={updateField}
        />
        <Form.Checkbox
          required
          name="has_delegate_support"
          checked={application.declarations.has_delegate_support}
          label={I18n.t('trainee_delegate_application.form.declaration_has_delegate_support')}
          onChange={updateDeclaration}
        />
        <Form.Dropdown
          required
          fluid
          multiple
          selection
          search
          disabled={!selectedRegion || !application.declarations.has_delegate_support}
          name="recommender_user_ids"
          label={I18n.t('trainee_delegate_application.form.recommenders')}
          placeholder={I18n.t('trainee_delegate_application.form.delegates_placeholder')}
          value={application.recommender_user_ids}
          options={delegateOptions}
          onChange={updateField}
        />

        <Header as="h2">{I18n.t('trainee_delegate_application.form.experience_and_motivation')}</Header>
        <Form.TextArea
          required
          name="introduction"
          label={I18n.t('trainee_delegate_application.form.introduction')}
          value={application.introduction}
          onChange={updateField}
        />
        <Form.TextArea
          required
          name="competition_contributions"
          label={I18n.t('trainee_delegate_application.form.competition_contributions')}
          value={application.competition_contributions}
          onChange={updateField}
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
          <Form.TextArea
            id="volunteer_history"
            name="volunteer_history"
            value={application.volunteer_history}
            onChange={updateField}
          />
        </Form.Field>

        <Form.TextArea
          required
          name="motivation"
          label={I18n.t('trainee_delegate_application.form.motivation')}
          value={application.motivation}
          onChange={updateField}
        />
        <Form.TextArea
          required
          name="relevant_skills"
          label={I18n.t('trainee_delegate_application.form.relevant_skills')}
          value={application.relevant_skills}
          onChange={updateField}
        />

        <Form.Field required>
          <label htmlFor="cubing_business_involvement_yes">
            {I18n.t('trainee_delegate_application.form.cubing_business_involvement')}
          </label>
          <Form.Group inline>
            <Form.Radio
              id="cubing_business_involvement_yes"
              name="cubing_business_involvement"
              value
              checked={application.cubing_business_involvement === true}
              label={I18n.t('trainee_delegate_application.form.yes')}
              onChange={updateField}
            />
            <Form.Radio
              id="cubing_business_involvement_no"
              name="cubing_business_involvement"
              value={false}
              checked={application.cubing_business_involvement === false}
              label={I18n.t('trainee_delegate_application.form.no')}
              onChange={updateField}
            />
          </Form.Group>
        </Form.Field>
        {application.cubing_business_involvement && (
          <Form.TextArea
            required
            name="cubing_business_involvement_details"
            label={I18n.t('trainee_delegate_application.form.cubing_business_involvement_details')}
            value={application.cubing_business_involvement_details}
            onChange={updateField}
          />
        )}

        <Button primary type="submit" disabled={!isApplicationComplete || isPending}>
          {I18n.t('trainee_delegate_application.form.submit')}
        </Button>
      </Form>
    </Container>
  );
}
