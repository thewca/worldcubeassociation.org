import React from 'react';
import { Header, List } from 'semantic-ui-react';

const IMPORTANT_LINKS = [
  {
    section: 'Guides',
    links: [
      {
        title: 'Delegate Handbook',
        link: 'https://documents.worldcubeassociation.org/edudoc/delegate-handbook/delegate-handbook.pdf',
      },
      {
        title: 'Guidelines for Disciplinary Incidents',
        link: 'https://documents.worldcubeassociation.org/edudoc/guidelines-for-disciplinary-incidents/guidelines-for-disciplinary-incidents.pdf',
      },
      {
        title: 'Visual Guide for Regulation 3j',
        link: 'https://drive.google.com/file/d/1m6THsA8fXRN7QFM4ApJbm6eVODKGbMLx/view',
      },
      {
        title: 'Visual Guide for Regulation 5b5f',
        link: 'https://drive.google.com/file/d/15XszaCGNvy3Dk6X6qERzZWZaDH1RH04z/view',
      },
    ],
  },
  {
    section: 'Forms',
    links: [
      {
        title: 'Gear Order Form',
        link: 'https://forms.gle/owX3ppZahYkoq9s48',
      },
      {
        title: 'Equipment Funding Form',
        link: 'https://docs.google.com/forms/d/e/1FAIpQLSebkWMyG2kRzR3cDm3jXFVMFCwd5u4XI6Yt35givu0SOidpHg/viewform',
      },
      {
        title: 'Travel Reimbursement Form',
        link: 'https://docs.google.com/forms/d/12tz2I_EeBORm14kQO6ZB5TOp321YbXkIXvrxUNIHxN0/viewform',
      },
      {
        title: 'WR Submission Form',
        link: 'https://docs.google.com/forms/d/e/1FAIpQLSeLrkLhFnIy1QNGoWoZT4jsOIibNJ_xc9qTd_YKBpcuMIq-LA/viewform',
      },
    ],
  },
];

function ListItemLink({ title, link }) {
  return (
    <List.Item>
      <a href={link} target="_blank" rel="noreferrer">
        {title}
      </a>
    </List.Item>
  );
}

export default function ImportantLinks() {
  return (
    <>
      <Header as="h2">Important Links</Header>
      {IMPORTANT_LINKS.map(({ section, links }) => (
        <List key={section}>
          <Header as="h3">{section}</Header>
          <List>
            {links.map(({ title, link }) => (
              <ListItemLink key={link} title={title} link={link} />
            ))}
          </List>
        </List>
      ))}
    </>
  );
}
