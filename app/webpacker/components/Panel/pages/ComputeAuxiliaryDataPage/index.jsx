import React from 'react';

import CronjobStatus from '../../views/CronJobStatus';
import { cronjobs } from '../../../../lib/wca-data.js.erb';

// i18n-tasks-use t('cronjobs.compute_auxiliary_data.steps.1')
// i18n-tasks-use t('cronjobs.compute_auxiliary_data.steps.2')
// i18n-tasks-use t('cronjobs.compute_auxiliary_data.steps.3')
export default function ComputeAuxiliaryDataPage() {
  return <CronjobStatus cronjobName={cronjobs.ComputeAuxiliaryData} />;
}
