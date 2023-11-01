import React from 'react';
import DatePicker from 'react-datepicker';
import {
  Button, Grid, GridColumn, GridRow,
} from 'semantic-ui-react';
import { wfcCompetitionsExportUrl } from '../../../lib/requests/routes.js.erb';

import 'react-datepicker/dist/react-datepicker.css';
import useRequest from '../../../lib/hooks/useRequest';

const dateFormat = 'YYYY-MM-DD';

export default function DuesExport() {
  const [fromDate, setFromDate] = React.useState(null);
  const [toDate, setToDate] = React.useState(null);
  const [wcaRequest, loading, data, error] = useRequest(() => {
    const fileUrl = URL.createObjectURL(new Blob([data], { type: 'text/tab-separated-value' }));
    // Create a hidden link to generate the download
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = fileUrl;
    a.download = `wfc-competitions-export-${moment(fromDate).format(dateFormat)}-${moment(toDate).format(dateFormat)}.tsv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(fileUrl);
  });

  const downloadDuesExport = () => {
    wcaRequest.get(wfcCompetitionsExportUrl, {
      params: {
        from_date: moment(fromDate).format(dateFormat),
        to_date: moment(toDate).format(dateFormat),
      },
      responseType: 'text',
    });
  };

  // TODO: Replace with Loading & Error, couldn't do it because these components are not shown due
  // to some CSS issue, the height of the component is 0px.
  if (loading) return 'Loading...';
  if (error) return 'Error...';

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
            onClick={downloadDuesExport}
          >
            Download
          </Button>
        </GridColumn>
      </GridRow>
    </Grid>
  );
}
