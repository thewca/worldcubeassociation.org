import React from 'react';

import CronjobStatus from '../../views/CronJobStatus';
import { cronjobs } from '../../../../lib/wca-data.js.erb';

export default function ComputeAuxiliaryDataPage() {
  return <CronjobStatus cronjobName={cronjobs.ComputeAuxiliaryData} />;
}
