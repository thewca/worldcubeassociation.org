import React, { useMemo } from 'react';
import { Button, Header } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import EventSelector from '../wca/EventSelector';

export default function ButtonGroupPicker({
  entityChoices,
  selectedEntityId,
  onEntityIdSelected,
  pickerLabel,
  computeEntityName,
}) {
  return (
    <>
      <Header as="h4">
        {pickerLabel}
        {' '}
        <Button
          size="mini"
          onClick={() => onEntityIdSelected(null)}
        >
          {I18n.t('competitions.index.clear')}
        </Button>
      </Header>
      <Button.Group>
        {entityChoices.map((entity, idx) => (
          <Button
            key={entity.id}
            toggle
            basic
            active={entity.id === selectedEntityId}
            onClick={() => onEntityIdSelected(entity.id)}
          >
            {computeEntityName(entity.id, idx)}
          </Button>
        ))}
      </Button.Group>
    </>
  );
}

export function EventsPickerCompat({
  entityChoices,
  selectedEntityId,
  onEntityIdSelected,
}) {
  const availableEventIds = useMemo(() => entityChoices.map((evt) => evt.id), [entityChoices]);

  return (
    <EventSelector
      selectedEvents={[selectedEntityId]}
      eventList={availableEventIds}
      onEventClick={onEntityIdSelected}
      hideAllButton
      onClearClick={() => onEntityIdSelected(null)}
      showBreakBeforeButtons={false}
    />
  );
}
