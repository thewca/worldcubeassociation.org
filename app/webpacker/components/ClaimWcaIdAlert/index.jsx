import React, { useState } from 'react';
import { Button, Message } from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import I18n from '../../lib/i18n';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import resetShouldClaimWcaId from './api/resetShouldClaimWcaId';
import { viewUrls } from '../../lib/requests/routes.js.erb';

export default function Wrapper({ shouldClaimWcaId }) {
  return (
    <WCAQueryClientProvider>
      <ClaimWcaIdAlert shouldClaimWcaId={shouldClaimWcaId} />
    </WCAQueryClientProvider>
  );
}

function ClaimWcaIdAlert({ shouldClaimWcaId }) {
  const [shouldClaimWcaIdResetSuccess, setShouldClaimWcaIdResetSuccess] = useState();
  const {
    mutate: resetShouldClaimWcaIdMutate,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: resetShouldClaimWcaId,
    onSuccess: () => setShouldClaimWcaIdResetSuccess(true),
  });

  if (!shouldClaimWcaId) return null;
  if (isPending) return <Loading />;
  if (isError) return <Errored error={error} />;

  if (shouldClaimWcaIdResetSuccess) {
    return (
      <Message positive>
        {I18n.t('users.claim_wca_id.after_sign_in.reset_success')}
      </Message>
    );
  }

  return (
    <Message warning>
      {I18n.t('users.claim_wca_id.after_sign_in.wca_claim_alert')}
      <br />
      <Button
        primary
        as="a"
        href={viewUrls.users.claimWcaIdPage}
      >
        {I18n.t('users.claim_wca_id.after_sign_in.claim_action')}
      </Button>
      <Button
        onClick={resetShouldClaimWcaIdMutate}
      >
        {I18n.t('users.claim_wca_id.after_sign_in.do_not_claim_action')}
      </Button>
    </Message>
  );
}
