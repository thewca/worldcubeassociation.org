import React from 'react';
import { Header, List } from 'semantic-ui-react';
import { allDelegatePageUrl, countryBandsUrl } from '../../../lib/requests/routes.js.erb';

const IMPORTANT_LINKS = [
  {
    title: 'Guidelines for Disciplinary Incidents',
    link: 'https://documents.worldcubeassociation.org/edudoc/guidelines-for-disciplinary-incidents/guidelines-for-disciplinary-incidents.pdf',
  },
  {
    title: 'All Delegates',
    link: allDelegatePageUrl,
  },
  {
    title: 'WR Submission Form',
    link: 'https://docs.google.com/forms/d/e/1FAIpQLSeJwf6b7yGGyWFhU0xfKSF3ki_nITyIKXVFRP86unb9EYRtHQ/viewform',
  },
  {
    title: 'Gear Order Form',
    link: 'https://forms.gle/owX3ppZahYkoq9s48',
  },
  {
    title: 'Travel Reimbursement Form',
    link: 'https://docs.google.com/forms/d/12tz2I_EeBORm14kQO6ZB5TOp321YbXkIXvrxUNIHxN0/viewform',
  },
  {
    title: 'Equipment Funding Form',
    link: 'https://docs.google.com/forms/d/e/1FAIpQLSebkWMyG2kRzR3cDm3jXFVMFCwd5u4XI6Yt35givu0SOidpHg/viewform',
  },
  {
    title: 'Bands for WCA Dues',
    link: countryBandsUrl,
  },
  {
    title: 'Visual Guide for Regulation 3j',
    link: 'https://drive.google.com/file/d/1m6THsA8fXRN7QFM4ApJbm6eVODKGbMLx/view',
  },
  {
    title: 'Visual Guide for Regulation 5b5f',
    link: 'https://drive.google.com/file/d/15XszaCGNvy3Dk6X6qERzZWZaDH1RH04z/view',
  },
];

function ListItemLink({ title, link }) {
  return (
    <List.Item>
      <a href={link} target="_blank" rel="noreferrer">{title}</a>
    </List.Item>
  );
}

export default function ImportantLinks() {
  return (
    <>
      <Header as="h2">Important Links</Header>
      <List>
        {IMPORTANT_LINKS.map(({ title, link }) => (
          <ListItemLink key={link} title={title} link={link} />
        ))}
      </List>
    </>
  );
}
