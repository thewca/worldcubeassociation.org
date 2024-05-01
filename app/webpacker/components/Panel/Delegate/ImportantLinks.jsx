import React from 'react';
import { Header, List } from 'semantic-ui-react';
import { allDelegatePageUrl, countryBandsUrl } from '../../../lib/requests/routes.js.erb';

const disciplinaryIncidentsGuidelinesLink = 'https://documents.worldcubeassociation.org/edudoc/guidelines-for-disciplinary-incidents/guidelines-for-disciplinary-incidents.pdf';
const wrSubmissionFormLink = 'https://docs.google.com/forms/d/e/1FAIpQLSeJwf6b7yGGyWFhU0xfKSF3ki_nITyIKXVFRP86unb9EYRtHQ/viewform';
const gearOrderFormLink = 'https://forms.gle/owX3ppZahYkoq9s48';
const travelReimbursementFormLink = 'https://docs.google.com/forms/d/12tz2I_EeBORm14kQO6ZB5TOp321YbXkIXvrxUNIHxN0/viewform';
const equipmentFundingFormLink = 'https://docs.google.com/forms/d/e/1FAIpQLSebkWMyG2kRzR3cDm3jXFVMFCwd5u4XI6Yt35givu0SOidpHg/viewform';
const visualGuideForReg3j = 'https://drive.google.com/file/d/1m6THsA8fXRN7QFM4ApJbm6eVODKGbMLx/view';
const visualGuideForReg5b5f = 'https://drive.google.com/file/d/15XszaCGNvy3Dk6X6qERzZWZaDH1RH04z/view';

export default function ImportantLinks() {
  return (
    <>
      <Header as="h2">Important Links</Header>
      <List>
        <List.Item>
          <a
            href={disciplinaryIncidentsGuidelinesLink}
            target="_blank"
            rel="noreferrer"
          >
            Guidelines for Disciplinary Incidents
          </a>
        </List.Item>
        <List.Item>
          <a
            href={allDelegatePageUrl}
            target="_blank"
            rel="noreferrer"
          >
            All Delegates
          </a>
        </List.Item>
        <List.Item>
          <a
            href={wrSubmissionFormLink}
            target="_blank"
            rel="noreferrer"
          >
            WR Submission Form
          </a>
        </List.Item>
        <List.Item>
          <a
            href={gearOrderFormLink}
            target="_blank"
            rel="noreferrer"
          >
            Gear Order Form
          </a>
        </List.Item>
        <List.Item>
          <a
            href={travelReimbursementFormLink}
            target="_blank"
            rel="noreferrer"
          >
            Travel Reimbursement Form
          </a>
        </List.Item>
        <List.Item>
          <a
            href={equipmentFundingFormLink}
            target="_blank"
            rel="noreferrer"
          >
            Equipment Funding Form
          </a>
        </List.Item>
        <List.Item>
          <a
            href={countryBandsUrl}
            target="_blank"
            rel="noreferrer"
          >
            Bands for WCA Dues
          </a>
        </List.Item>
        <List.Item>
          <a
            href={visualGuideForReg3j}
            target="_blank"
            rel="noreferrer"
          >
            Visual Guide for Regulation 3j
          </a>
        </List.Item>
        <List.Item>
          <a
            href={visualGuideForReg5b5f}
            target="_blank"
            rel="noreferrer"
          >
            Visual Guide for Regulation 5b5f
          </a>
        </List.Item>
      </List>
    </>
  );
}
