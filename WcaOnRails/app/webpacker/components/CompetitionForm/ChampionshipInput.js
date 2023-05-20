/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect, useContext } from 'react';
import {
  Button,
  Form,
  Icon,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import { championshipRegionsUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import FormContext from './FormContext';

function ChampionshipSelect({
  inputState, index, regions, disabled,
}) {
  const localState = {
    value: inputState.value[index].region,
    onChange: (e, { value }) => {
      const newValue = [...inputState.value];
      newValue[index].region = value;
      inputState.onChange(newValue);
    },
  };

  const remove = () => {
    const newValue = [...inputState.value];
    newValue.splice(index, 1);
    inputState.onChange(newValue);
  };

  return (
    <Form.Field>
      <label>{I18n.t('activerecord.attributes.championship.championship_type')}</label>
      <Form.Group>
        <Form.Select
          width={6}
          options={regions}
          value={localState.value}
          onChange={localState.onChange}
          basic
          disabled={disabled}
        />
        <Form.Button icon color="red" onClick={remove} disabled={disabled}>
          <Icon inverted name="close" />
        </Form.Button>
      </Form.Group>
    </Form.Field>
  );
}

function getAvailibleId(data) {
  const ids = data.map((championship) => championship.id);
  let id = 0;
  while (ids.includes(id)) id += 1;
  return id;
}

export default function ChampionshipInput({ inputState }) {
  const [regions, setRegions] = useState();
  const [loading, setLoading] = useState(true);

  const { disabled } = useContext(FormContext);

  useEffect(() => {
    fetch(championshipRegionsUrl)
      .then((response) => response.json())
      .then((json) => {
        const options = [];
        Object.keys(json).forEach((region) => {
          options.push({
            disabled: true,
            key: region,
            value: region,
            text: region,
          });
          json[region].forEach((championship) => {
            options.push({
              key: championship[1],
              value: championship[1],
              text: championship[0],
            });
          });
        });
        setRegions(options);
        setLoading(false);
      });
  }, []);

  const onClick = async () => {
    const champs = [...inputState.value];
    champs.push({
      id: getAvailibleId(champs),
      region: regions.find((region) => !region.disabled).value,
    });
    inputState.onChange(champs);
  };

  if (loading) return <Loading />;
  return (
    <>
      {inputState.value.map((_, index) => (
        <ChampionshipSelect
          key={inputState.value[index].id}
          inputState={inputState}
          index={index}
          regions={regions}
          disabled={disabled}
        />
      ))}
      <Button basic onClick={onClick} onKeyPress={null} type="button" disabled={disabled}>
        <Icon name="plus" />
        {I18n.t('competitions.competition_form.add_championship')}
      </Button>
    </>
  );
}
