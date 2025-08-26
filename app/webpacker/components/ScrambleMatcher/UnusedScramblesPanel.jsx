import React, { useCallback, useMemo, useState } from 'react';
import {
  Button, Card, Divider, Header, Segment,
} from 'semantic-ui-react';
import _ from 'lodash';
import {
  groupScrambleSetsIntoWcif,
  matchingDndConfig,
  pickerLocalizationConfig,
  pickerStepConfig,
  searchRecursive,
} from './util';
import MoveMatchingEntityModal from './MoveMatchingEntityModal';

const filterUnusedItems = (
  scrambleFileMaster,
  matchState,
  history = [],
  currentKey = 'events',
  previousMatcher = undefined,
) => {
  if (!currentKey || !scrambleFileMaster) {
    return [];
  }

  const {
    enabledCondition,
    matchingConfigKey,
    nestedPicker = matchingConfigKey,
  } = pickerStepConfig[currentKey] || {};

  const currentPickerEnabled = enabledCondition?.(history) ?? true;

  const masterItems = scrambleFileMaster[currentKey];
  const workingItems = matchState?.[currentKey];

  const usedIds = workingItems?.map((itm) => itm.id);
  const unusedItems = masterItems.filter((masterItem) => !usedIds?.includes(masterItem.id));

  const currentStepReturn = { key: currentKey, unused: unusedItems };

  if (!nestedPicker || !currentPickerEnabled) {
    return [currentStepReturn];
  }

  const unusedBranches = masterItems.map((masterItem, i) => {
    const workingItemCandidate = workingItems?.find((itm) => itm.id === masterItem.id);

    const nextHistory = [
      ...history,
      {
        key: currentKey,
        id: masterItem.id,
        entity: masterItem,
        index: i,
      },
    ];

    return filterUnusedItems(
      masterItem,
      workingItemCandidate,
      nextHistory,
      nestedPicker,
      matchingConfigKey,
    );
  });

  const combinedUnused = _.chain(unusedBranches)
    .flatten()
    .groupBy('key')
    .map((group, key) => ({
      key,
      unused: group.flatMap((gr) => gr.unused),
    }))
    .value();

  if (previousMatcher !== currentKey) {
    return combinedUnused;
  }

  return [currentStepReturn, ...combinedUnused];
};

export function UnusedEntityButtonGroup({
  entity,
  fullPathToEntity,
  referenceMatchState,
  onClickAutoAssign,
  onClickManualAssign,
}) {
  const autoInsertTarget = fullPathToEntity[fullPathToEntity.length - 2];

  const autoInsertNavigation = searchRecursive(referenceMatchState, autoInsertTarget);

  return (
    <Button.Group compact widths={2}>
      {autoInsertNavigation && (
        <Button
          positive
          basic
          icon="magic"
          content="Auto-Assign"
          onClick={() => onClickAutoAssign(entity, autoInsertNavigation)}
        />
      )}
      <Button
        primary
        basic
        icon="pen"
        content="Manual"
        onClick={() => onClickManualAssign(entity)}
      />
    </Button.Group>
  );
}

function UnusedEntitiesPanel({
  matchingKey,
  unusedEntities,
  dispatchMatchState,
  scrambleFilesTree,
  rootMatchState,
}) {
  const {
    computeCellName,
    computeCellDetails,
    cellDetailsAreData = false,
  } = matchingDndConfig[matchingKey];

  const { headerLabel } = pickerLocalizationConfig[matchingKey];

  const [modalPayload, setModalPayload] = useState(null);

  const onModalClose = useCallback(() => {
    setModalPayload(null);
  }, [setModalPayload]);

  const addBackEntity = useCallback((entity, pickerHistory) => dispatchMatchState({
    type: 'addEntityToMatching',
    entity,
    pickerHistory,
    matchingKey,
  }), [dispatchMatchState, matchingKey]);

  if (unusedEntities.length === 0) {
    return null;
  }

  return (
    <>
      <Header attached="top">
        Unused
        {' '}
        {headerLabel}
      </Header>
      <Segment attached>
        <Card.Group>
          {unusedEntities.map((entity) => {
            const pathToUnusedEntity = searchRecursive(
              scrambleFilesTree,
              { key: matchingKey, id: entity.id },
            );

            return (
              <Card key={entity.id}>
                <Card.Content>
                  <Card.Header>{computeCellName(entity)}</Card.Header>
                  {computeCellDetails && !cellDetailsAreData && (
                    <Card.Meta>{computeCellDetails(entity)}</Card.Meta>
                  )}
                </Card.Content>
                <Card.Content extra>
                  <UnusedEntityButtonGroup
                    entity={entity}
                    fullPathToEntity={pathToUnusedEntity}
                    referenceMatchState={rootMatchState}
                    onClickAutoAssign={addBackEntity}
                    onClickManualAssign={setModalPayload}
                  />
                  <MoveMatchingEntityModal
                    key={modalPayload?.id}
                    isOpen={modalPayload !== null}
                    onClose={onModalClose}
                    onConfirm={addBackEntity}
                    selectedMatchingEntity={modalPayload}
                    rootMatchState={rootMatchState}
                    pickerHistory={pathToUnusedEntity.slice(0, -1)}
                    matchingKey={matchingKey}
                    isAddMode
                  />
                </Card.Content>
              </Card>
            );
          })}
        </Card.Group>
      </Segment>
    </>
  );
}

export default function UnusedScramblesPanel({
  scrambleFiles,
  matchState,
  dispatchMatchState,
}) {
  const scrambleFilesTree = useMemo(() => {
    const allScrambleSets = scrambleFiles.flatMap((file) => file.inbox_scramble_sets);

    return groupScrambleSetsIntoWcif(allScrambleSets);
  }, [scrambleFiles]);

  const unusedPickerEntities = filterUnusedItems(scrambleFilesTree, matchState);
  const anyUnusedEntries = unusedPickerEntities.some((step) => step.unused.length > 0);

  return (
    <>
      {anyUnusedEntries && <Divider />}
      {unusedPickerEntities.map((unusedStep) => (
        <UnusedEntitiesPanel
          key={unusedStep.key}
          matchingKey={unusedStep.key}
          unusedEntities={unusedStep.unused}
          dispatchMatchState={dispatchMatchState}
          scrambleFilesTree={scrambleFilesTree}
          rootMatchState={matchState}
        />
      ))}
    </>
  );
}
