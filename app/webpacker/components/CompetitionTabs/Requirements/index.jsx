import React from 'react';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import RegistrationRequirements from './RegistrationRequirements';

export default function Wrapper({
  competition, userInfo,
}) {
  return (
    <WCAQueryClientProvider>
      <RegistrationRequirements
        competition={competition}
        userInfo={userInfo}
      />
    </WCAQueryClientProvider>
  );
}
