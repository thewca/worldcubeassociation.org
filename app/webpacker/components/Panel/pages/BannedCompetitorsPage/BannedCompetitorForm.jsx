import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import WcaSearch from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import UtcDatePicker from '../../../wca/UtcDatePicker';
import useSaveAction from '../../../../lib/hooks/useSaveAction';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';

export default function BanendCompetitorForm({
  sync, banAction, banActionRole, closeForm,
}) {
  const [formValues, setFormValues] = useState({
    user: null,
    endDate: banActionRole?.end_date,
  });
  const [formError, setFormError] = useState();
  const { save, saving } = useSaveAction();

  const handleFormChange = (_, { name, value }) => setFormValues({ ...formValues, [name]: value });

  const createNewBannedCompetitor = () => {
    save(apiV0Urls.userRoles.create(), {
      userId: formValues?.user?.id,
      groupType: groupTypes.banned_competitors,
      endDate: formValues?.endDate,
    }, () => {
      sync();
      closeForm();
    }, { method: 'POST' }, setFormError);
  };

  const editBannedCompetitor = () => {
    save(apiV0Urls.userRoles.update(banActionRole.id), {
      endDate: formValues?.endDate,
    }, () => {
      sync();
      closeForm();
    }, { method: 'PATCH' }, setFormError);
  };

  const formSubmitHandler = banAction === 'new' ? createNewBannedCompetitor : editBannedCompetitor;

  if (saving) return <Loading />;
  if (formError) return <Errored error={formError} />;

  return (
    <Form onSubmit={formSubmitHandler}>
      {banAction === 'new' && (
        <Form.Field
          label="New Banned competitor"
          control={WcaSearch}
          name="user"
          value={formValues?.user}
          onChange={handleFormChange}
          model={SEARCH_MODELS.user}
          multiple={false}
        />
      )}
      <Form.Field
        label="End Date"
        name="endDate"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="YYYY-MM-dd"
        dropdownMode="select"
        isoDate={formValues?.endDate}
        onChange={(date) => handleFormChange(null, {
          name: 'endDate',
          value: date,
        })}
      />
      <Form.Button onClick={closeForm}>Cancel</Form.Button>
      <Form.Button type="submit">Save</Form.Button>
    </Form>
  );
}
