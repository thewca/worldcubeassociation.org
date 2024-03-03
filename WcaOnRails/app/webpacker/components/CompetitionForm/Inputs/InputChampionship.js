import React from 'react';
import {
  Button,
  DropdownHeader,
  Form,
  Icon,
} from 'semantic-ui-react';
import _ from 'lodash';
import { groupedChampionshipTypes } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';

const generateChampionshipName = (type, championship) => {
  switch (type) {
    case 'planetary':
      return I18n.t('competitions.competition_form.championship_types.world');
    case 'continental':
      return I18n.t(`continents.${championship}`);
    case 'multi-national':
      return I18n.t(`competitions.competition_form.championship_types.${championship}`) || I18n.t('competitions.competition_form.championship_types.generic', { type: championship });
    case 'national':
      return I18n.t(`countries.${championship}`);
    default:
      return championship;
  }
};

const championshipOptions = Object.keys(groupedChampionshipTypes).flatMap((type) => {
  const actualOptions = groupedChampionshipTypes[type].map((championship) => ({
    key: championship,
    value: championship,
    text: generateChampionshipName(type, championship),
  }));

  return [
    {
      as: DropdownHeader,
      key: type,
      text: _.capitalize(type),
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
