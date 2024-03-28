import React, { useEffect, useState } from 'react';
import {
  Form, Message, FormGroup, FormField,
} from 'semantic-ui-react';
import DatePicker from 'react-datepicker';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import WcaSearch from '../../SearchWidget/WcaSearch';
import I18n from '../../../lib/i18n';
import 'react-datepicker/dist/react-datepicker.css';
import {
  apiV0Urls, delegatesPageUrl, personUrl, contactDobUrl,
} from '../../../lib/requests/routes.js.erb';
import Loading from '../../Requests/Loading';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import UserBadge from '../../UserBadge';
import useInputState from '../../../lib/hooks/useInputState';
import SEARCH_MODELS from '../../SearchWidget/SearchModel';

const dateFormat = 'YYYY-MM-DD';
const queryClient = new QueryClient();

function ClaimWcaId() {
  const [unconfirmedPerson, setUnconfirmedPerson] = useInputState();
  const [dobVerification, setDobVerification] = useState();
  const [delegateToVerify, setDelegateToVerify] = useInputState();
  const [manualDelegateSelection, setManualDelegateSelection] = useState(false);
  const unconfirmedWcaId = unconfirmedPerson?.item?.wca_id || '';
  const {
    isLoading: isCanClaimLoading,
    data: canClaimData,
    refetch: refetchCanClaim,
  } = useQuery(
    {
      queryKey: ['canClaim', unconfirmedWcaId],
      queryFn: () => fetchJsonOrError(apiV0Urls.persons.canClaim(unconfirmedWcaId)),
      enabled: !!unconfirmedWcaId,
    },
  );
  const {
    isLoading: isLikelyDelegatesLoading,
    data: likelyDelegatesData,
    refetch: refetchLikelyDelegates,
  } = useQuery(
    {
      queryKey: ['likelyDelegates', unconfirmedWcaId],
      queryFn: () => fetchJsonOrError(apiV0Urls.persons.likelyDelegates(unconfirmedWcaId)),
      enabled: !!unconfirmedWcaId,
    },
  );
  const { data: { can_claim: canClaim, reason } } = canClaimData || { data: {} };
  const { data: { likely_delegates: likelyDelegates } } = likelyDelegatesData || { data: {} };
  const loading = isCanClaimLoading || isLikelyDelegatesLoading;

  useEffect(() => {
    if (unconfirmedWcaId) {
      refetchCanClaim();
      refetchLikelyDelegates();
    }
  }, [refetchCanClaim, refetchLikelyDelegates, unconfirmedWcaId]);

  useEffect(() => {
    if (manualDelegateSelection) {
      setDelegateToVerify(null);
    }
  }, [manualDelegateSelection, setDelegateToVerify]);

  return (
    // DatePicker inside semantic FormField works with proper CSS only if it's inside semantic Form.
    // But currently it's inside rails form, hence to make the CSS work, <div className="ui form">
    // is added instead of fragment.
    <div className="ui form">
      <Form.Field
        control={WcaSearch}
        label={I18n.t('common.user.wca_id')}
        model={SEARCH_MODELS.person}
        multiple={false}
        onChange={setUnconfirmedPerson}
        value={unconfirmedPerson}
      />
      <Form.Input
        name="user[unconfirmed_wca_id]"
        style={{ display: 'none' }}
        value={unconfirmedWcaId}
      />
      <Form.Input
        name="user[delegate_id_to_handle_wca_id_claim]"
        style={{ display: 'none' }}
        value={delegateToVerify?.id}
      />
      {(loading) && <Loading />}
      {unconfirmedWcaId && canClaim && !loading && (
        <>
          <Form.Field
            control={DatePicker}
            label={I18n.t('activerecord.attributes.user.dob_verification')}
            name="user[dob_verification]"
            onChange={(date) => setDobVerification(moment(date).format(dateFormat))}
            scrollableYearDropdown
            selected={dobVerification}
            showYearDropdown
            value={dobVerification}
          />
          <I18nHTMLTranslate
            // i18n-tasks-use t('page.sign_up.form.select_delegate')
            i18nKey="page.sign_up.form.select_delegate"
            options={{
              wca_id: unconfirmedWcaId,
              wca_id_link: personUrl(unconfirmedWcaId),
              delegates_link: delegatesPageUrl,
              dob_form_path: contactDobUrl,
            }}
          />
          {!manualDelegateSelection && (
            <FormGroup grouped>
              {likelyDelegates.map((likelyDelegate) => (
                <FormField
                  label={(
                    <UserBadge
                      user={likelyDelegate}
                      hideBorder
                      leftAlign
                      subtexts={likelyDelegate.wca_id ? [likelyDelegate.wca_id] : []}
                    />
                )}
                  value={likelyDelegate.id}
                  checked={delegateToVerify === likelyDelegate}
                  onChange={setDelegateToVerify}
                  control="input"
                  type="radio"
                />
              ))}
              <FormField
                label={I18n.t('page.sign_up.form.select_another_delegate')}
                onChange={() => {
                  setManualDelegateSelection(true);
                }}
                control="input"
                type="radio"
              />
            </FormGroup>
          )}
          {manualDelegateSelection && (
            <Form.Field
              control={WcaSearch}
              model={SEARCH_MODELS.user}
              multiple={false}
              onChange={(_, { value }) => setDelegateToVerify(value)}
              value={delegateToVerify}
              params={{ only_staff_delegates: true }}
            />
          )}
        </>
      )}
      <Form.Input
        name="user[delegate_id_to_handle_wca_id_claim]"
        style={{ display: 'none' }}
        value={delegateToVerify?.id}
      />
      {unconfirmedWcaId && !canClaim && reason && (
        <Message>
          <I18nHTMLTranslate
            // i18n-tasks-use t('page.sign_up.form.can_claim_error.wca_id_not_found')
            // i18n-tasks-use t('page.sign_up.form.can_claim_error.wca_id_already_claimed')
            // i18n-tasks-use t('page.sign_up.form.can_claim_error.dob_not_found')
            i18nKey={`page.sign_up.form.can_claim_error.${reason}`}
            options={{
              wca_id: unconfirmedWcaId,
              wca_id_link: personUrl(unconfirmedWcaId),
              delegates_link: delegatesPageUrl,
              dob_form_path: contactDobUrl,
            }}
          />
        </Message>
      )}
    </div>
  );
}

export default function ClaimWcaIdWithReactQuery() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClaimWcaId />
    </QueryClientProvider>
  );
}
