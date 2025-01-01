import React from 'react';
import GeneralInfoTab from './GeneralInfoTab';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';

export default function Wrapper({
  competition, userInfo, records, winners, media,
}) {
  return (
    <WCAQueryClientProvider>
      <GeneralInfoTab
        competition={competition}
        userInfo={userInfo}
        records={records}
        media={media}
        winners={winners}
      />
    </WCAQueryClientProvider>
  );
}
