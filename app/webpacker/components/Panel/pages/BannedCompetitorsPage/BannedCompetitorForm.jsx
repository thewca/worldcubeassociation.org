import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes, banScopes } from '../../../../lib/wca-data.js.erb';
import WcaSearch from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import UtcDatePicker from '../../../wca/UtcDatePicker';
import useSaveAction from '../../../../lib/hooks/useSaveAction';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import I18n from '../../../../lib/i18n';

const banScopeOptions = Object.keys(banScopes).map((option) => ({
  key: option,
  // i18n-tasks-use t('enums.user_roles.ban_scope.competing_only')
  // i18n-tasks-use t('enums.user_roles.ban_scope.competing_and_attending')
  // i18n-tasks-use t('enums.user_roles.ban_scope.competing_and_attending_and_forums')
  text: I18n.t(`enums.user_roles.ban_scope.${option}`),
  value: option,
}));

export default function BanendCompetitorForm({
  sync, banAction, banActionRole, closeForm,
}) {
  const [formValues, setFormValues] = useState({
    user: null,
    startDate: banActionRole?.start_date,
    endDate: banActionRole?.end_date,
    banReason: banActionRole?.metadata.ban_reason,
    scope: banActionRole?.metadata.scope,
  });
  const [formError, setFormError] = useState();
  const { save, saving } = useSaveAction();

  const handleFormChange = (_, { name, value }) => setFormValues({ ...formValues, [name]: value });

  const createNewBannedCompetitor = () => {
    save(apiV0Urls.userRoles.create(), {
      userId: formValues?.user?.id,
      groupType: groupTypes.banned_competitors,
      startDate: formValues?.startDate || new Date().toISOString().split('T')[0],
      endDate: formValues?.endDate,
      banReason: formValues?.banReason,
      scope: formValues?.scope,
    }, () => {
      sync();
      closeForm();
    }, { method: 'POST' }, setFormError);
  };

  const editBannedCompetitor = () => {
    save(apiV0Urls.userRoles.update(banActionRole.id), {
      startDate: formValues?.startDate || new Date().toISOString().split('T')[0],
      endDate: formValues?.endDate,
      banReason: formValues?.banReason,
      scope: formValues?.scope,
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
        label="Start Date"
        name="startDate"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="yyyy-MM-dd"
        dropdownMode="select"
        isoDate={formValues?.startDate}
        onChange={(date) => handleFormChange(null, {
          name: 'startDate',
          value: date,
        })}
        placeholderText="Leave empty to use current date"
      />
      <Form.Field
        label="End Date"
        name="endDate"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="yyyy-MM-dd"
        dropdownMode="select"
        isoDate={formValues?.endDate}
        onChange={(date) => handleFormChange(null, {
          name: 'endDate',
          value: date,
        })}
      />
      <Form.Input
        label="Ban Reason"
        name="banReason"
        value={formValues?.banReason}
        onChange={handleFormChange}
      />
      <Form.Dropdown
        label="Ban Scope"
        name="scope"
        value={formValues?.scope}
        onChange={handleFormChange}
        options={banScopeOptions}
      />
      <Form.Button onClick={closeForm}>Cancel</Form.Button>
      <Form.Button type="submit">Save</Form.Button>
    </Form>
  );
}
