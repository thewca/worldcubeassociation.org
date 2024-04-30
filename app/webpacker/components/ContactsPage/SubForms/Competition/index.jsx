import React from 'react';
import { FormTextArea } from 'semantic-ui-react';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import I18n from '../../../../lib/i18n';

export default function Competition({ formValues, setFormValues }) {
  const handleFormChange = (_, { name, value }) => setFormValues(
    { ...formValues, [name]: value },
  );

  return (
    <>
      <IdWcaSearch
        label={I18n.t('page.contacts.form.competition.competition.label')}
        name="competitionId"
        value={formValues.competitionId}
        onChange={handleFormChange}
        model={SEARCH_MODELS.competition}
        multiple={false}
      />
      <FormTextArea
        label={I18n.t('page.contacts.form.competition.message.label')}
        name="message"
        value={formValues.message}
        onChange={handleFormChange}
      />
    </>
  );
}
