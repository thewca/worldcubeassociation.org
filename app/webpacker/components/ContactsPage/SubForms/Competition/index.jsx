import React, { useEffect, useState } from 'react';
import { FormTextArea } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import WcaSearch from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import I18n from '../../../../lib/i18n';
import useQueryParams from '../../../../lib/hooks/useQueryParams';
import { fetchJsonOrError } from '../../../../lib/requests/fetchWithAuthenticityToken';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import Loading from '../../../Requests/Loading';
import { itemToOption } from '../../../SearchWidget/MultiSearchInput';

const FORM_DEFAULT_VALUE = {
  competition: null,
  message: '',
};

export default function Competition({ setSubformValues, setFormValid }) {
  const [queryParams] = useQueryParams();
  const [formValues, setFormValues] = useState(FORM_DEFAULT_VALUE);
  const handleFormChange = (_, { name, value }) => setFormValues(
    { ...formValues, [name]: value },
  );
  const { data: competitionData, isLoading } = useQuery({
    queryKey: ['competition'],
    queryFn: () => fetchJsonOrError(apiV0Urls.competitions.info(queryParams.competitionId)),
    enabled: !!queryParams?.competitionId,
  });

  useEffect(() => {
    setSubformValues(formValues);
    setFormValid(formValues.competition !== null && formValues.message?.length > 0);
  }, [formValues, setFormValid, setSubformValues]);

  useEffect(() => {
    if (competitionData && !formValues.competition) {
      setFormValues({
        ...formValues,
        competition: itemToOption(competitionData.data),
      });
    }
  }, [competitionData, formValues]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      {formValues.competition
        ? `${I18n.t('page.contacts.form.competition.competition.label')}: ${formValues.competition.item.name}`
        : (
          <WcaSearch
            label={I18n.t('page.contacts.form.competition.competition.label')}
            name="competition"
            value={formValues.competition}
            onChange={handleFormChange}
            model={SEARCH_MODELS.competition}
            multiple={false}
          />
        )}
      <FormTextArea
        label={I18n.t('page.contacts.form.competition.message.label')}
        name="message"
        value={formValues.message}
        onChange={handleFormChange}
      />
    </>
  );
}
