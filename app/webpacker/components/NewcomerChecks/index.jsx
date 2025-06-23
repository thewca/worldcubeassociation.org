import React from 'react';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import DuplicateChecker from './DuplicateChecker';

export default function Wrapper({ competitionId }) {
  return (
    <WCAQueryClientProvider>
      <DuplicateChecker competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}
