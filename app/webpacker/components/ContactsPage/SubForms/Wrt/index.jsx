import React, { useMemo } from 'react';
import {
  FormField, FormGroup, Radio,
} from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import { useDispatch, useStore } from '../../../../lib/providers/StoreProvider';
import { updateSectionData } from '../../store/actions';
import OtherQuery from './OtherQuery';
import Loading from '../../../Requests/Loading';
import useLoggedInUserPermissions from '../../../../lib/hooks/useLoggedInUserPermissions';

const SECTION = 'wrt';
const QUERY_TYPES = [
  {
    key: 'edit_profile',
    requiredPermission: null,
  },
  {
    key: 'edit_others_profile',
    requiredPermission: 'canRequestToEditOthersProfile',
  },
  {
    key: 'report_result_issue',
    requiredPermission: null,
  },
  {
    key: 'other_query',
    requiredPermission: null,
  },
];
const QUERY_TYPES_MAP = _.keyBy(QUERY_TYPES, (item) => (_.camelCase(item.key)));

export default function Wrt() {
  const { formValues: { wrt } } = useStore();
  const { queryType: selectedQueryType } = wrt || {};
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSectionData(SECTION, name, value),
  );
  const { loggedInUserPermissions, loading: permissionsLoading } = useLoggedInUserPermissions();

  const QueryForm = useMemo(() => {
    if (
      !selectedQueryType
       || [
         QUERY_TYPES_MAP.editProfile.key,
         QUERY_TYPES_MAP.editOthersProfile.key,
       ].includes(selectedQueryType)) {
      return null;
    }
    return OtherQuery;
  }, [selectedQueryType]);

  if (permissionsLoading) return <Loading />;

  return (
    <>
      <FormGroup grouped>
        <div>{I18n.t('page.contacts.form.wrt.query_type.label')}</div>
        {QUERY_TYPES.map(({ key: queryTypeKey, requiredPermission }) => (
          (!requiredPermission || loggedInUserPermissions[requiredPermission]) && (
            <FormField key={queryTypeKey}>
              <Radio
                label={I18n.t(`page.contacts.form.wrt.query_type.${queryTypeKey}.label`)}
                name="queryType"
                value={queryTypeKey}
                checked={selectedQueryType === queryTypeKey}
                onChange={handleFormChange}
              />
            </FormField>
          )
        ))}
      </FormGroup>
      {QueryForm && <QueryForm />}
    </>
  );
}
