import {
  GridColumn, Header, Icon, Segment, Statistic, StatisticGroup, StatisticLabel, StatisticValue,
} from 'semantic-ui-react';
import React from 'react';

function CountStat({ title, data }) {
  return (
    <>
      <Header>{title}</Header>
      <StatisticGroup>
        {data.map((d) => d.count > 0 && (
          <Statistic key={d.label} horizontal>
            <StatisticValue textAlign="center">{d.count}</StatisticValue>
            <StatisticLabel>
              <Icon name={d.icon} color={d.iconColor} />
            &nbsp;
              {d.label}
            </StatisticLabel>
          </Statistic>
        ))}
      </StatisticGroup>
    </>
  );
}

export default function CountStats({ person }) {
  return (
    <>
      {person.medals.total > 0 && (
        <GridColumn>
          <Segment raised padded>
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
          </Segment>
        </GridColumn>
      )}
      {person.records.total > 0 && (
        <GridColumn>
          <Segment raised padded>
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
          </Segment>
        </GridColumn>
      )}
    </>
  );
}
