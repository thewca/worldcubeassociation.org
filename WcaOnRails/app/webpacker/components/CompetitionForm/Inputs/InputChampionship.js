import React from 'react';
import {
  Button,
  DropdownHeader,
  Form,
  Icon,
} from 'semantic-ui-react';
import { groupedChampionshipTypes } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';

const championshipOptions = Object.keys(groupedChampionshipTypes).flatMap((region) => {
  const actualOptions = groupedChampionshipTypes[region].map((championship) => ({
    key: championship[1],
    value: championship[1],
    text: championship[0],
  }));

  return [
    {
      as: DropdownHeader,
      key: region,
      text: region,
      disabled: true,
    },
    ...actualOptions,
  ];
});

export function ChampionshipSelect({
  value,
  onChange,
  onRemove,
}) {
  return (
    <Form.Group>
      <Form.Select
        width={6}
        options={championshipOptions}
        value={value}
        onChange={onChange}
      />
      <Form.Button icon negative onClick={onRemove}>
        <Icon inverted name="close" />
      </Form.Button>
    </Form.Group>
  );
}

export function AddChampionshipButton({ onClick }) {
  return (
    <Button basic icon onClick={onClick} type="button">
      <Icon name="plus" />
      {I18n.t('competitions.competition_form.add_championship')}
    </Button>
  );
}
