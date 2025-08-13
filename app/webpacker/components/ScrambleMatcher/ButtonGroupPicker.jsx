import React from 'react';
import { Button, Header } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

export default function ButtonGroupPicker({
  availableEntities,
  selectedEntityId,
  onEntityIdSelected,
  header,
  entityToName,
}) {
  return (
    <>
      <Header as="h4">
        {header}
        {' '}
        <Button
          size="mini"
          onClick={() => onEntityIdSelected(null)}
        >
          {I18n.t('competitions.index.clear')}
        </Button>
      </Header>
      <Button.Group>
        {availableEntities.map((entity, idx) => (
          <Button
            key={entity.id}
            toggle
            basic
            active={entity.id === selectedEntityId}
            onClick={() => onEntityIdSelected(entity.id)}
          >
            {entityToName(entity, idx)}
          </Button>
        ))}
      </Button.Group>
    </>
  );
}
