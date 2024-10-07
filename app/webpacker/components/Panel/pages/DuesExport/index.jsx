import React from 'react';
import {
  Button, Grid, GridColumn, GridRow,
} from 'semantic-ui-react';
import { wfcCompetitionsExportUrl } from '../../../../lib/requests/routes.js.erb';

import UtcDatePicker from '../../../wca/UtcDatePicker';

export default function DuesExport() {
  const [fromDate, setFromDate] = React.useState(null);
  const [toDate, setToDate] = React.useState(null);

  return (
    <Grid centered>
      <GridRow>
        <GridColumn width={8}>Start Date</GridColumn>
        <GridColumn width={8}>
          <UtcDatePicker
            onChange={setFromDate}
            isoDate={fromDate}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn width={8}>End Date</GridColumn>
        <GridColumn width={8}>
          <UtcDatePicker
            onChange={setToDate}
            isoDate={toDate}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn>
          <Button
            disabled={!fromDate || !toDate}
            href={`${wfcCompetitionsExportUrl}?${new URLSearchParams({
              from_date: fromDate,
              to_date: toDate,
            }).toString()}`}
            target="_blank"
          >
            Download
          </Button>
        </GridColumn>
      </GridRow>
    </Grid>
  );
}
