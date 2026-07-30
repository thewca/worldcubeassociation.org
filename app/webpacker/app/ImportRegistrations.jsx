import React, { useState } from 'react';
import { Message, Tab } from 'semantic-ui-react';
import I18n from '../lib/i18n';
import RegistrationPreview from '../components/ImportRegistrations/RegistrationPreview';
import UploadRegistrationCsv from '../components/ImportRegistrations/UploadRegistrationCsv';
import WCAQueryClientProvider from '../lib/providers/WCAQueryClientProvider';

export default function Wrapper({ competitionId }) {
  return (
    <WCAQueryClientProvider>
      <ImportRegistrations competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}

function ImportRegistrations({ competitionId }) {
  const [success, setSuccess] = useState();
  const [registrationsToPreview, setRegistrationsToPreview] = useState();
  const panes = [
    {
      menuItem: 'Upload Registration CSV',
      render: () => (
        <Tab.Pane>
          <UploadRegistrationCsv
            competitionId={competitionId}
            setRegistrationsToPreview={setRegistrationsToPreview}
          />
        </Tab.Pane>
      ),
    },
  ];

  if (success) {
    return <Message success>{I18n.t('registrations.flash.imported')}</Message>;
  }

  return (
    <>
      <Message info>
        {I18n.t('registrations.import.info')}
      </Message>
      <Tab panes={panes} />
      {registrationsToPreview && (
        <RegistrationPreview
          registrations={registrationsToPreview}
          competitionId={competitionId}
          onClose={() => setRegistrationsToPreview(null)}
          onImportSuccess={() => setSuccess(true)}
        />
      )}
    </>
  );
}
