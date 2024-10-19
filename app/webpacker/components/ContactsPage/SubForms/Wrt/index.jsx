import React, { useEffect, useMemo } from 'react';
import {
  FormField, FormGroup, Radio,
} from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import { useDispatch, useStore } from '../../../../lib/providers/StoreProvider';
import { setFormRedirection, updateSectionData } from '../../store/actions';
import OtherQuery from './OtherQuery';
import { contactEditProfileActionUrl } from '../../../../lib/requests/routes.js.erb';

const SECTION = 'wrt';
const QUERY_TYPES = ['edit_profile', 'report_result_issue', 'other_query'];
const QUERY_TYPES_MAP = _.keyBy(QUERY_TYPES, _.camelCase);

export default function Wrt() {
  const { formValues: { wrt } } = useStore();
  const { queryType: selectedQueryType } = wrt || {};
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSectionData(SECTION, name, value),
  );

  const QueryForm = useMemo(() => {
    if (!selectedQueryType || selectedQueryType === QUERY_TYPES_MAP.editProfile) return null;
    return OtherQuery;
  }, [selectedQueryType]);

  useEffect(() => {
    if (selectedQueryType === QUERY_TYPES_MAP.editProfile) {
      dispatch(setFormRedirection(SECTION, contactEditProfileActionUrl));
    } else {
      dispatch(setFormRedirection(SECTION, null));
    }
  }, [dispatch, selectedQueryType]);

  return (
    <>
      <FormGroup grouped>
        <div>{I18n.t('page.contacts.form.wrt.query_type.label')}</div>
        {QUERY_TYPES.map((queryType) => (
          <FormField key={queryType}>
            <Radio
              label={I18n.t(`page.contacts.form.wrt.query_type.${queryType}.label`)}
              name="queryType"
              value={queryType}
              checked={selectedQueryType === queryType}
              onChange={handleFormChange}
            />
          </FormField>
        ))}
      </FormGroup>
      {QueryForm && <QueryForm />}
    </>
  );
}
