import React from 'react';
import {
  Card,
  CardGroup,
  Container,
  Menu,
  MenuItem,
} from 'semantic-ui-react';
import RecordTable from './RecordTable';
import ProfileDetails from './ProfileDetails';

import './person.css';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import CountStats from './CountStats';
import Badges from '../Badges';

function PreviousDetails({ person }) {
  if (!person.previousPersons || person.previousPersons.length === 0) return null;
  return (
    <Card.Meta textAlign="center">
      (
      <I18nHTMLTranslate i18nKey="persons.show.previously" />
      {' '}
      {person.previousPersons
        .map((previousPerson) => `${previousPerson.name} - ${previousPerson.country}`)
        .join(', ')}
      )
    </Card.Meta>
  );
}

export default function Person({ person }) {
  return (
    <Container id="profile" fluid textAlign="center">
      <CardGroup centered>
        <Card fluid className="card-flat">
          <Card.Content>
            <Card.Header textAlign="center">
              {person.name}
            </Card.Header>
            <PreviousDetails person={person} />
            <Card.Description>
              <Badges userId={person.user.id} />
            </Card.Description>
          </Card.Content>
        </Card>
      </CardGroup>
      <img src={person.user.avatar.url} alt="avatar" className="avatar" />
      <Card.Group centered className="collapsing-card-container">
        <ProfileDetails person={person} />
        <CountStats person={person} />
      </Card.Group>
      <Card.Group centered className="card-container">
        <Card fluid className="max-card" color="green">
          <Card.Content>
            <Card.Header textAlign="center">
              Current Personal Records
            </Card.Header>
            <Card.Description className="max-card-content">
              <RecordTable person={person} />
            </Card.Description>
          </Card.Content>
        </Card>
        <Card fluid className="max-card" color="orange">
          <Card.Content>
            <Menu pointing secondary size="large">
              <MenuItem
                name="home"
                active
              />
            </Menu>
            <Card.Description className="max-card-content">
              <RecordTable person={person} />
            </Card.Description>
          </Card.Content>
        </Card>
      </Card.Group>
    </Container>
  );
}
