import React from 'react';
import { FormTextArea } from 'semantic-ui-react';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import I18n from '../../../../lib/i18n';
import { useDispatch, useStore } from '../../../../lib/providers/StoreProvider';
import { updateSectionData } from '../../store/actions';

const SECTION = 'competition';

export default function Competition() {
  const { competition } = useStore();
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSectionData(SECTION, name, value),
  );

  return (
    <>
      <IdWcaSearch
        label={I18n.t('page.contacts.form.competition.competition.label')}
        name="competitionId"
        value={competition?.competitionId}
        onChange={handleFormChange}
        model={SEARCH_MODELS.competition}
        multiple={false}
      />
      <FormTextArea
        label={I18n.t('page.contacts.form.competition.message.label')}
        name="message"
        value={competition?.message}
        onChange={handleFormChange}
      />
    </>
  );
}
