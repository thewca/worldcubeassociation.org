import {
  Card, CardContent, Icon, Table,
} from 'semantic-ui-react';
import React from 'react';

function CountStat({ title, data }) {
  return (
    <Card fluid className="small-card">
      <Card.Content>
        <Card.Header textAlign="center">
          {title}
        </Card.Header>
        <Card.Description>
          <Table basic="very" className="count-stat" unstackable>
            <Table.Body>
              {data.map((d) => (
                <Table.Row key={d.label}>
                  <Table.Cell>
                    <Icon name={d.icon} color={d.iconColor} />
                    &nbsp;
                    {d.label}
                  </Table.Cell>
                  <Table.Cell textAlign="center">{d.count}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Description>
      </Card.Content>
      <CardContent extra>
        Total:
        {' '}
        {data.reduce((acc, d) => acc + d.count, 0)}
      </CardContent>
    </Card>
  );
}

export default function CountStats({ person }) {
  return (
    <>
      {person.medals.total > 0 && (
        <CountStat
          title="Medals"
          data={[
            {
              label: 'Gold', icon: 'trophy', iconColor: 'yellow', count: person.medals.gold,
            },
            {
              label: 'Silver', icon: 'trophy', iconColor: 'grey', count: person.medals.silver,
            },
            {
              label: 'Bronze', icon: 'trophy', iconColor: 'orange', count: person.medals.bronze,
            },
          ]}
        />
      )}
      {person.records.total > 0 && (
        <CountStat
          title="Records"
          data={[
            {
              label: 'World', icon: 'globe', iconColor: 'green', count: person.records.world,
            },
            {
              label: 'Continental', icon: 'map', iconColor: 'teal', count: person.records.continental,
            },
            {
              label: 'National', icon: 'flag', iconColor: 'blue', count: person.records.national,
            },
          ]}
        />
      )}
    </>
  );
}
