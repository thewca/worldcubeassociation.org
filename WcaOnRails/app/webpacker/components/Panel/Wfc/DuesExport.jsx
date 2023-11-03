import React from 'react';
import DatePicker from 'react-datepicker';
import {
  Button, Grid, GridColumn, GridRow,
} from 'semantic-ui-react';
import { wfcCompetitionsExportUrl } from '../../../lib/requests/routes.js.erb';

import 'react-datepicker/dist/react-datepicker.css';

const dateFormat = 'YYYY-MM-DD';

export default function DuesExport() {
  const [fromDate, setFromDate] = React.useState(null);
  const [toDate, setToDate] = React.useState(null);

  return (
    <Grid>
      <GridRow>
        <GridColumn width={8}>Start Date</GridColumn>
        <GridColumn width={8}>
          <DatePicker
            onChange={setFromDate}
            selected={fromDate}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn width={8}>End Date</GridColumn>
        <GridColumn width={8}>
          <DatePicker
            onChange={setToDate}
            selected={toDate}
          />
        </GridColumn>
      </GridRow>
      <GridRow>
        <GridColumn>
          <Button
            disabled={!fromDate || !toDate}
            href={`${wfcCompetitionsExportUrl}?${new URLSearchParams({
              from_date: moment(fromDate).format(dateFormat),
              to_date: moment(toDate).format(dateFormat),
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
