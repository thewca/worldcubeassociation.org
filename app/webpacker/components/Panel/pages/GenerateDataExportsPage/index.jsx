import React from 'react';
import CronjobStatus from '../../views/CronJobStatus';
import { cronjobs } from '../../../../lib/wca-data.js.erb';

export default function GenerateDataExportsPage() {
  return (
    <>
      <CronjobStatus cronjobName={cronjobs.DumpDeveloperDatabase} />
      <CronjobStatus cronjobName={cronjobs.DumpPublicResultsDatabase} />
    </>
  );
}
