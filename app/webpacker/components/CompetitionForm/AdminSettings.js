import {
  Header,
  List,
} from 'semantic-ui-react';
import React from 'react';
import I18n from '../../lib/i18n';
import { useStore } from '../../lib/providers/StoreProvider';
import {
  adminActionsQueryKey,
  useAdminActions,
} from './api';
import Loading from '../Requests/Loading';
import { InputBooleanSelect, InputNumber } from '../wca/FormBuilder/input/FormInputs';
import ConditionalSection from './FormSections/ConditionalSection';

export default function AdminSettings({ competitionId }) {
  const { isAdminView } = useStore();

  const {
    data: adminActionData,
    isLoading,
  } = useAdminActions(competitionId);

  if (isLoading) return <Loading />;

  return (
    <>
      <Header style={{ marginTop: 0 }}>{I18n.t('competitions.admin_settings')}</Header>
      <InputBooleanSelect id="autoAcceptEnabled" required />
      <ConditionalSection showIf={adminActionData.autoAcceptEnabled}>
        <InputNumber id="autoAcceptDisableThreshold" />
      </ConditionalSection>
    </>
  )
}
