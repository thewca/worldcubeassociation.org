import React from 'react';
import WCAQueryClientProvider from '../lib/providers/WCAQueryClientProvider';
import TraineeDelegateApplication from '../components/TraineeDelegateApplication';

export default function Wrapper({
  applicant,
  eligibilityIssues,
  minimumAge,
  delegateRegions,
  volunteerRoleHistory,
}) {
  return (
    <WCAQueryClientProvider>
      <TraineeDelegateApplication
        applicant={applicant}
        eligibilityIssues={eligibilityIssues}
        minimumAge={minimumAge}
        delegateRegions={delegateRegions}
        volunteerRoleHistory={volunteerRoleHistory}
      />
    </WCAQueryClientProvider>
  );
}
