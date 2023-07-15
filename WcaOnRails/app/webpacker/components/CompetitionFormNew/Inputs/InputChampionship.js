import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Button, Form, Icon } from 'semantic-ui-react';
import { championshipRegionsUrl } from '../../../lib/requests/routes.js.erb';
import Loading from '../../Requests/Loading';
import I18n from '../../../lib/i18n';
import FormContext from '../State/FormContext';

function Championship({
  value,
  regions,
  onChange,
  onRemove,
}) {
  return (
    <Form.Field>
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label>{I18n.t('activerecord.attributes.championship.championship_type')}</label>
      <Form.Group>
        <Form.Select
          width={6}
          options={regions}
          value={value}
          onChange={onChange}
          basic
        />
        <Form.Button icon color="red" onClick={onRemove}>
          <Icon inverted name="close" />
        </Form.Button>
      </Form.Group>
    </Form.Field>

  );
}

function AddChampionshipButton({ onClick }) {
  return (
    <Button basic onClick={onClick} onKeyPress={null} type="button">
      <Icon name="plus" />
      {I18n.t('competitions.competition_form.add_championship')}
    </Button>
  );
}

async function fetchRegions() {
  const response = await fetch(championshipRegionsUrl);
  const json = await response.json();

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

  return options;
}

export default function InputChampionship({ id }) {
  const { formData, setFormData } = useContext(FormContext);

  const rawValue = formData[id];

  const value = Array.isArray(rawValue) ? rawValue : [];
  const [internalValue, setInternalValue] = useState(value.map((c, i) => ({
    championship: c,
    itemId: i,
  })));

  const onChange = useCallback((newInternalValue) => {
    setInternalValue(newInternalValue);
    const newValue = newInternalValue.map(({ championship }) => championship);
    setFormData((previousData) => ({ ...previousData, [id]: newValue }));
  }, [id, setFormData]);

  const [regions, setRegions] = useState(null);
  const [loading, setLoading] = useState(value.length > 0);

  useEffect(() => {
    if (loading && !regions) {
      fetchRegions().then((options) => {
        setRegions(options);
        setLoading(false);
      });
    }
  }, []);

  const onClickAdd = useCallback(async () => {
    if (loading && !regions) return;
    let validRegions = regions;
    if (!validRegions) {
      setLoading(true);

      validRegions = await fetchRegions();
      setRegions(validRegions);
      setLoading(false);
    }

    const firstValidRegion = validRegions.find((region) => !region.disabled).value;
    const maxId = Math.max(...internalValue.map(({ itemId }) => itemId), -1) + 1;
    onChange([...internalValue, { championship: firstValidRegion, itemId: maxId }]);
  }, [internalValue, onChange, loading, setLoading, regions]);

  if (loading) return <Loading />;

  return (
    <>
      {internalValue.map(({ championship, itemId }, index) => (
        <Championship
          key={itemId}
          value={championship}
          regions={regions}
          onChange={(_, { value: newValue }) => {
            const newValueArray = [...internalValue];
            newValueArray[index].championship = newValue;
            onChange(newValueArray);
          }}
          onRemove={() => {
            const newValueArray = [...internalValue];
            newValueArray.splice(index, 1);
            onChange(newValueArray);
          }}
        />
      ))}
      <AddChampionshipButton onClick={onClickAdd} />
    </>
  );
}
