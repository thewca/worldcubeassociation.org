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
            <StatisticValue textAlign="center">
              {d.onClick ? <a style={{ cursor: 'pointer' }} onClick={d.onClick}>{d.count}</a> : d.count}
            </StatisticValue>
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

export default function CountStats({ medals, records, setHighlight }) {
  return (
    <>
      {medals.total > 0 && (
        <GridColumn>
          <Segment raised padded>
            <CountStat
              title="Medals"
              data={[
                {
                  label: 'Gold', icon: 'trophy', iconColor: 'yellow', count: medals.gold, onClick: () => setHighlight(1),
                },
                {
                  label: 'Silver', icon: 'trophy', iconColor: 'grey', count: medals.silver, onClick: () => setHighlight(2),
                },
                {
                  label: 'Bronze', icon: 'trophy', iconColor: 'orange', count: medals.bronze, onClick: () => setHighlight(3),
                },
              ]}
            />
          </Segment>
        </GridColumn>
      )}
      {records.total > 0 && (
        <GridColumn>
          <Segment raised padded>
            <CountStat
              title="Records"
              data={[
                {
                  label: 'World', icon: 'globe', iconColor: 'green', count: records.world,
                },
                {
                  label: 'Continental', icon: 'map', iconColor: 'teal', count: records.continental,
                },
                {
                  label: 'National', icon: 'flag', iconColor: 'blue', count: records.national,
                },
              ]}
            />
          </Segment>
        </GridColumn>
      )}
    </>
  );
}
