import React from 'react';
import { Card, Grid, Header } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

function Stat({ children, label, width }) {
  return (
    <Grid.Column
      stretched
      className="stat"
      width={width}
    >
      <Header size="tiny" sub block>
        {label}
        <Header className="stat">{children}</Header>
      </Header>
    </Grid.Column>
  );
}

function FlagIcon({ countryIso2 }) {
  return (
    <span
      className={`fi fi-${countryIso2.toLowerCase()}`}
    />
  );
}

export default function ProfileDetails({ person }) {
  const profile = {
    region: person.country,
    wcaId: person.wcaId,
    gender: person.gender,
    competitions: person.competitionCount,
    solves: person.completedSolves,
  };
  const statCount = 2
    + (profile.gender ? 1 : 0)
    + (profile.competitions ? 1 : 0)
    + (profile.solves ? 1 : 0);

  const regionWidth = 16; // (statCount % 2) == 1 ? 11 : 8;
  const idWidth = (statCount % 2) === 0 ? 16 : 8;
  const otherWidth = 8;

  return (
    <Card fluid className="large-card">
      <Card.Content>
        <Card.Header textAlign="center">
          Profile
        </Card.Header>
        <Grid textAlign="center" className="stat-grid">
          <Stat label="Representing" width={regionWidth}>
            <FlagIcon countryIso2={profile.region.iso2} />
            {' '}
            {profile.region.name}
          </Stat>
          <Stat label="WCA ID" width={idWidth}>{profile.wcaId}</Stat>
          {profile.gender && (
            <Stat label="Gender" width={otherWidth}>
              <I18nHTMLTranslate i18nKey={`enums.user.gender.${profile.gender}`} />
            </Stat>
          )}
          {profile.solves && <Stat label="Solves" width={otherWidth}>{profile.solves}</Stat>}
          {profile.competitions && <Stat label="Competitions" width={otherWidth}>{profile.competitions}</Stat>}
        </Grid>
      </Card.Content>
    </Card>
  );
}
