import React, { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Modal } from 'semantic-ui-react';
import RegistrationsAdministrationTable from '../RegistrationsV2/RegistrationAdministration/RegistrationsAdministrationTable';
import importRegistrations from './api/importRegistrations';
import Errored from '../Requests/Errored';
import I18n from '../../lib/i18n';

function transformRegistration(registrationRow, index) {
  // gender is not available in RegistrationsAdministrationTable,
  // hence it won't be available in preview.
  return {
    id: index,
    user_id: index,
    user: {
      wca_id: registrationRow.wcaId || null,
      name: registrationRow.name,
      country: { iso2: registrationRow.countryIso2 },
      dob: registrationRow.birthdate,
      email: registrationRow.email,
    },
    competing: {
      event_ids: registrationRow.registration.eventIds,
      registered_on: registrationRow.registration.registeredAt,
    },
    guests: 0,
  };
}

const COLUMNS_EXPANDED = {
  dob: true,
  region: false,
  events: true,
  comments: false,
  email: true,
  timestamp: false,
};

export default function RegistrationPreview({
  registrations, competitionId, onClose, onImportSuccess,
}) {
  const {
    mutate: importMutate, isPending, isError, error,
  } = useMutation({
    mutationFn: importRegistrations,
    onSuccess: onImportSuccess,
  });

  const tableRegistrations = useMemo(
    () => (registrations || []).map(transformRegistration),
    [registrations],
  );

  const competitionInfo = useMemo(() => {
    const allEventIds = [...new Set(
      tableRegistrations.flatMap((r) => r.competing.event_ids),
    )];

    return {
      id: competitionId,
      event_ids: allEventIds,
      'using_payment_integrations?': false,
    };
  }, [tableRegistrations, competitionId]);

  return (
    <Modal
      open={!!registrations}
      onClose={onClose}
      closeOnEscape
      size="fullscreen"
    >
      <Modal.Header>Preview Registration Data</Modal.Header>
      <Modal.Content scrolling>
        {isError && <Errored error={error} />}
        <RegistrationsAdministrationTable
          columnsExpanded={COLUMNS_EXPANDED}
          registrations={tableRegistrations}
          selected={[]}
          competitionInfo={competitionInfo}
          isReadOnly
          sortable
        />
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose} disabled={isPending}>
          {I18n.t('registrations.import.cancel')}
        </Button>
        <Button
          primary
          onClick={() => importMutate({ competitionId, registrations })}
          loading={isPending}
        >
          {I18n.t('registrations.import.import')}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
