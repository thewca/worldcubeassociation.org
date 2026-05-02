import React, { useState } from 'react';
import { Button, Grid } from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import WcaSearch from '../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../SearchWidget/SearchModel';
import I18n from '../../../lib/i18n';
import assignWcaIdToUser from '../../NewcomerChecks/api/assignWcaIdToUser';

export default function AssignWcaIdView({
  userId,
  specialAccount,
}) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const newWcaId = selectedPerson?.id || '';

  const onSuccess = () => window.location.reload();

  const { mutate: assignWcaIdMutation, isPending: isAssigningPending } = useMutation({
    mutationFn: () => assignWcaIdToUser({ userId, wcaId: newWcaId }),
    onSuccess,
  });

  const handleAssignClick = () => {
    if (isAssigning) {
      assignWcaIdMutation();
    } else {
      setIsAssigning(true);
    }
  };

  return (
    <>
      <Grid.Column width={isAssigning ? 10 : 4}>
        {isAssigning ? (
          <WcaSearch
            model={SEARCH_MODELS.person}
            value={selectedPerson}
            onChange={(e, data) => setSelectedPerson(data.value)}
            multiple={false}
            disabled={isAssigningPending}
            label={I18n.t('users.edit.assign_wca_id')}
          />
        ) : (
          <span className="text-muted">None</span>
        )}
      </Grid.Column>

      <Grid.Column width={isAssigning ? 6 : 12}>
        <Button
          type="button"
          size="small"
          id="assign-wca-id"
          disabled={specialAccount || isAssigningPending || (isAssigning && !newWcaId)}
          onClick={handleAssignClick}
          loading={isAssigningPending}
          color={isAssigning ? 'green' : undefined}
        >
          {isAssigning ? I18n.t('users.edit.save') : I18n.t('users.edit.assign_wca_id')}
        </Button>
        {isAssigning && (
          <Button
            type="button"
            size="small"
            onClick={() => setIsAssigning(false)}
            disabled={isAssigningPending}
          >
            {I18n.t('users.edit.cancel')}
          </Button>
        )}
      </Grid.Column>
    </>
  );
}
