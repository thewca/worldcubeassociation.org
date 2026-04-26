import React, { useState } from 'react';
import {
  Button, Form, Grid, Header, List, Segment,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import SEARCH_MODELS from '../SearchWidget/SearchModel';
import WcaSearch, { useIdQueries } from '../SearchWidget/WcaSearch';
import UserItem from '../SearchWidget/UserItem';
import I18n from '../../lib/i18n';
import assignWcaIdToUser from '../NewcomerChecks/api/assignWcaIdToUser';
import unlinkWcaId from './api/unlinkWcaId';
import confirmWcaId from './api/confirmWcaId';
import clearClaimWcaId from './api/clearClaimWcaId';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import ConfirmProvider, { useConfirm } from '../../lib/providers/ConfirmProvider';

export default function Wrapper({
  userId,
  wcaId,
  unconfirmedWcaId,
  canEditAnyUser,
  specialAccount,
}) {
  return (
    <WCAQueryClientProvider>
      <ConfirmProvider>
        <EditUserWcaId
          userId={userId}
          wcaId={wcaId}
          unconfirmedWcaId={unconfirmedWcaId}
          canEditAnyUser={canEditAnyUser}
          specialAccount={specialAccount}
        />
      </ConfirmProvider>
    </WCAQueryClientProvider>
  );
}

export function EditUserWcaId({
  userId,
  wcaId,
  unconfirmedWcaId,
  canEditAnyUser,
  specialAccount,
}) {
  const confirm = useConfirm();
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const newWcaId = selectedPerson?.id || '';

  const idsToFetch = [unconfirmedWcaId || wcaId].filter(Boolean);
  const { data: personsData } = useIdQueries({
    model: SEARCH_MODELS.person,
    idsToFetch,
  });
  const personToShow = personsData?.[0];

  const onSuccess = () => window.location.reload();

  const { mutate: assignWcaIdMutation, isPending: isAssigningPending } = useMutation({
    mutationFn: () => assignWcaIdToUser({ userId, wcaId: newWcaId }),
    onSuccess,
  });

  const { mutate: unlinkWcaIdMutation, isPending: isUnlinkingPending } = useMutation({
    mutationFn: () => unlinkWcaId(userId),
    onSuccess,
  });

  const { mutate: confirmWcaIdMutation, isPending: isConfirmingPending } = useMutation({
    mutationFn: () => confirmWcaId(userId, unconfirmedWcaId),
    onSuccess,
  });

  const { mutate: clearClaimWcaIdMutation, isPending: isClearingPending } = useMutation({
    mutationFn: () => clearClaimWcaId(userId),
    onSuccess,
  });

  const disableWcaIdButton = !canEditAnyUser || specialAccount;
  const showSpecialAccountMessage = canEditAnyUser && specialAccount;
  const isWcaIdBlank = !wcaId;
  const targetAttributeTranslation = I18n.t(
    unconfirmedWcaId ? 'activerecord.attributes.user.unconfirmed_wca_id' : 'activerecord.attributes.user.wca_id',
  );

  const handleAssignClick = () => {
    if (isAssigning) {
      assignWcaIdMutation();
    } else {
      setIsAssigning(true);
    }
  };

  const handleUnlinkClick = () => {
    confirm({
      content: I18n.t('users.edit.unlink_confirm', { wca_id: wcaId }),
    }).then(() => unlinkWcaIdMutation()).catch(() => {});
  };

  const handleConfirmClick = () => {
    confirm({
      content: I18n.t('users.edit.approve_confirm', { wca_id: unconfirmedWcaId }),
    }).then(() => confirmWcaIdMutation()).catch(() => {});
  };

  const handleClearClaimClick = () => {
    confirm({
      content: I18n.t('users.edit.clear_claim_confirm', { wca_id: unconfirmedWcaId }),
    }).then(() => clearClaimWcaIdMutation()).catch(() => {});
  };

  const isPending = (
    isAssigningPending || isUnlinkingPending || isConfirmingPending || isClearingPending
  );

  let content;
  if (unconfirmedWcaId) {
    content = (
      <UnconfirmedWcaIdView
        unconfirmedWcaId={unconfirmedWcaId}
        personToShow={personToShow}
        isPending={isPending}
        isConfirmingPending={isConfirmingPending}
        isClearingPending={isClearingPending}
        handleConfirmClick={handleConfirmClick}
        handleClearClaimClick={handleClearClaimClick}
      />
    );
  } else if (isWcaIdBlank) {
    content = (
      <AssignWcaIdView
        isAssigning={isAssigning}
        setIsAssigning={setIsAssigning}
        selectedPerson={selectedPerson}
        setSelectedPerson={setSelectedPerson}
        isPending={isPending}
        isAssigningPending={isAssigningPending}
        handleAssignClick={handleAssignClick}
        disableWcaIdButton={disableWcaIdButton}
        newWcaId={newWcaId}
      />
    );
  } else {
    content = (
      <ConfirmedWcaIdView
        wcaId={wcaId}
        personToShow={personToShow}
        isPending={isPending}
        isUnlinkingPending={isUnlinkingPending}
        handleUnlinkClick={handleUnlinkClick}
        disableWcaIdButton={disableWcaIdButton}
      />
    );
  }

  return (
    <Segment secondary id="wca_id" style={{ marginBottom: '1.5rem' }}>
      <Header as="h5" style={{ marginBottom: '1rem' }}>
        {targetAttributeTranslation}
      </Header>

      <Grid verticalAlign="middle">
        <Grid.Row>
          {content}
        </Grid.Row>
        {showSpecialAccountMessage && (
          <Grid.Row>
            <Grid.Column width={16}>
              <p className="help-block">
                {I18n.t('users.edit.account_is_special')}
              </p>
            </Grid.Column>
          </Grid.Row>
        )}
      </Grid>
    </Segment>
  );
}

function UnconfirmedWcaIdView({
  unconfirmedWcaId,
  personToShow,
  isPending,
  isConfirmingPending,
  isClearingPending,
  handleConfirmClick,
  handleClearClaimClick,
}) {
  return (
    <Grid.Column width={16}>
      <List horizontal verticalAlign="middle">
        <List.Item>
          {personToShow ? (
            <UserItem item={personToShow} />
          ) : (
            <span>{unconfirmedWcaId}</span>
          )}
        </List.Item>

        <List.Item>
          <Button
            size="small"
            color="green"
            id="approve-wca-id"
            onClick={handleConfirmClick}
            loading={isConfirmingPending}
            disabled={isPending}
          >
            {I18n.t('users.edit.approve')}
          </Button>
        </List.Item>
        <List.Item>
          <Button
            size="small"
            color="red"
            id="clear-claim-wca-id"
            onClick={handleClearClaimClick}
            loading={isClearingPending}
            disabled={isPending}
          >
            {I18n.t('users.edit.clear_claim')}
          </Button>
        </List.Item>
      </List>
    </Grid.Column>
  );
}

function AssignWcaIdView({
  isAssigning,
  setIsAssigning,
  selectedPerson,
  setSelectedPerson,
  isPending,
  isAssigningPending,
  handleAssignClick,
  disableWcaIdButton,
  newWcaId,
}) {
  return (
    <Grid.Column width={16}>
      <List horizontal verticalAlign="middle">
        <List.Item>
          {isAssigning ? (
            <div style={{ minWidth: '300px' }}>
              <WcaSearch
                model={SEARCH_MODELS.person}
                value={selectedPerson}
                onChange={(e, data) => setSelectedPerson(data.value)}
                multiple={false}
                disabled={isPending}
                label={I18n.t('users.edit.assign_wca_id')}
              />
            </div>
          ) : (
            <span className="text-muted">None</span>
          )}
        </List.Item>

        <List.Item>
          <Button
            type="button"
            size="small"
            id="assign-wca-id"
            disabled={disableWcaIdButton || isPending || (isAssigning && !newWcaId)}
            onClick={handleAssignClick}
            loading={isAssigningPending}
            color={isAssigning ? 'green' : undefined}
          >
            {isAssigning ? I18n.t('users.edit.save') : I18n.t('users.edit.assign_wca_id')}
          </Button>
        </List.Item>
        {isAssigning && (
          <List.Item>
            <Button
              type="button"
              size="small"
              onClick={() => setIsAssigning(false)}
              disabled={isPending}
            >
              {I18n.t('users.edit.cancel')}
            </Button>
          </List.Item>
        )}
      </List>
    </Grid.Column>
  );
}

function ConfirmedWcaIdView({
  wcaId,
  personToShow,
  isPending,
  isUnlinkingPending,
  handleUnlinkClick,
  disableWcaIdButton,
}) {
  return (
    <Grid.Column width={16}>
      <List horizontal verticalAlign="middle">
        <List.Item>
          {personToShow ? (
            <UserItem item={personToShow} />
          ) : (
            <span>{wcaId}</span>
          )}
        </List.Item>
        <List.Item>
          <Button
            type="button"
            size="small"
            color="red"
            id="unlink-wca-id"
            disabled={disableWcaIdButton || isPending}
            onClick={handleUnlinkClick}
            loading={isUnlinkingPending}
          >
            {I18n.t('users.edit.unlink_wca_id')}
          </Button>
        </List.Item>
      </List>
    </Grid.Column>
  );
}
