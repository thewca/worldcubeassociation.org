import React from 'react';
import CronjobStatus from '../../views/CronJobStatus';
import { cronjobs } from '../../../../lib/wca-data.js.erb';

// i18n-tasks-use t('cronjobs.dump_developer_database.steps.1')
// i18n-tasks-use t('cronjobs.dump_developer_database.steps.2')
// i18n-tasks-use t('cronjobs.dump_public_results_database.steps.1')
// i18n-tasks-use t('cronjobs.dump_public_results_database.steps.2')
export default function GenerateDataExportsPage() {
  return (
    <>
      <CronjobStatus cronjobName={cronjobs.DumpDeveloperDatabase} />
      <CronjobStatus cronjobName={cronjobs.DumpPublicResultsDatabase} />
    </>
  );
}
