import React, { useCallback, useMemo, useState } from 'react';
import {
  Accordion, Grid, Icon, List, Popup,
} from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../../lib/i18n';
import Markdown from '../../Markdown';
import { countries, events } from '../../../lib/wca-data.js.erb';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import EventIcon from '../../wca/EventIcon';
import { competitionUrl, contactCompetitionUrl, personUrl } from '../../../lib/requests/routes.js.erb';
import InformationList from './InformationList';
import { PseudoLinkMarkdown } from '../../../lib/utils/competition-table';

const linkToGoogleMapsPlace = (latitude, longitude) => `https://www.google.com/maps/place/${latitude},${longitude}`;

function DateWithCalendar({ competition }) {
  return (
    <>
      {competition.date_range}
      <a
        href={competitionUrl(competition.id, 'ics')}
        title={I18n.t('competitions.competition_info.add_to_calendar')}
      >
        <Icon name="calendar plus" />
      </a>
    </>
  );
}

function VenueAddressLink({ competition }) {
  return (
    <a
      href={linkToGoogleMapsPlace(
        competition.latitude_degrees,
        competition.longitude_degrees,
      )}
    >
      {competition.venue_address}
    </a>
  );
}

function ExternalWebsiteLink({ competition }) {
  return (
    <a
      href={competition.external_website}
      target="_blank"
      rel="noopener noreferrer"
    >
      {`${competition.name} website`}
    </a>
  );
}

function ContactInformation({ competition }) {
  return competition.contact ? (
    <Markdown md={competition.contact} id="competition-info-contact" />
  ) : (
    <a
      href={contactCompetitionUrl(competition.id)}
    >
      {I18n.t('competitions.competition_info.organization_team')}
    </a>
  );
}

function OrganizersList({ competition }) {
  return competition.organizers
    .toSorted((o1, o2) => o1.name.localeCompare(o2.name))
    .map((user, i) => (
      <React.Fragment key={user.id}>
        {user.wca_id ? (
          <a href={personUrl(user.wca_id)}>{user.name}</a>
        ) : (
          user.name
        )}
        {i !== competition.organizers.length - 1 && ', '}
      </React.Fragment>
    ));
}

function DelegatesList({ competition }) {
  return competition.delegates
    .toSorted((d1, d2) => d1.name.localeCompare(d2.name))
    .map((user, i) => (
      <React.Fragment key={user.id || i}>
        {user.wca_id ? (
          <a href={personUrl(user.wca_id)}>{user.name}</a>
        ) : (
          user.name
        )}
        {i !== competition.delegates.length - 1 && ', '}
      </React.Fragment>
    ));
}

function PdfDownloadLink({ competition }) {
  return (
    <I18nHTMLTranslate
      // i18n-tasks-use t('competitions.competition_info.pdf.download_html')
      i18nKey="competitions.competition_info.pdf.download_html"
      options={
        {
          here: (
            `<a
              href=${competitionUrl(competition.id, 'pdf')}
              target="_blank"
              rel="noreferrer"
            >
              ${I18n.t('common.here')}
            </a>`
          ),
        }
      }
    />
  );
}

export default function DateAddressContact({ competition }) {
  const infoEntries = useMemo(() => {
    const entries = [
      {
        header: I18n.t('competitions.competition_info.date'),
        content: (<DateWithCalendar competition={competition} />),
        icon: 'calendar plus',
      },
      {
        header: I18n.t('competitions.competition_info.city'),
        content: (
          <>
            {competition.city}
            {', '}
            {countries.byIso2[competition.country_iso2].name}
          </>
        ),
        icon: 'map marker alternate',
      },
      {
        header: I18n.t('competitions.competition_info.venue'),
        content: (<Markdown md={competition.venue} id="competition-info-venue" />),
        icon: 'building outline',
      },
      {
        header: I18n.t('competitions.competition_info.address'),
        content: (<VenueAddressLink competition={competition} />),
        icon: 'map outline',
      }];

    if (competition.venue_details) {
      entries.push({
        header: I18n.t('competitions.competition_info.details'),
        content: (<PseudoLinkMarkdown text={competition.venue_details} />),
        icon: 'info circle',
      });
    }

    if (competition.external_website) {
      entries.push({
        header: I18n.t('competitions.competition_info.website'),
        content: (<ExternalWebsiteLink competition={competition} />),
        icon: 'globe',
      });
    }

    entries.push(
      {
        header: I18n.t('competitions.competition_info.contact'),
        content: (<ContactInformation competition={competition} />),
        icon: 'comment outline',
      },
    );

    if (competition.organizers.length > 0) {
      entries.push({
        header: I18n.t('competitions.competition_info.organizer_plural', {
          count: competition.organizers.length,
        }),
        content: (<OrganizersList competition={competition} />),
        icon: 'folder open outline',
      });
    }

    entries.push({
      header: I18n.t('competitions.competition_info.delegate', {
        count: competition.delegates.length,
      }),
      content: (<DelegatesList competition={competition} />),
      icon: 'address card outline',
    });

    if (competition['has_schedule?']) {
      entries.push({
        icon: 'print',
        content: (<PdfDownloadLink competition={competition} />),
      });
    }

    return entries;
  }, [competition]);

  return (
    <InformationList items={infoEntries} />
  );
}
