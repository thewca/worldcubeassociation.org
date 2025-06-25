import React from 'react';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import LivestreamManager from './LivestreamManager';

export default function LivestreamManagementContainer({
  inputTestLink, inputLiveLink,
}) {
  return (
    <WCAQueryClientProvider>
      <LivestreamManager inputTestLink={inputTestLink} inputLiveLink={inputLiveLink} />
    </WCAQueryClientProvider>
  );
}
