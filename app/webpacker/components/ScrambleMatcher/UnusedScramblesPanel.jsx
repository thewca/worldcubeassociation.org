import React, { useCallback, useMemo, useState } from 'react';
import {
  Button, Card, Divider, Header, Segment,
} from 'semantic-ui-react';
import _ from 'lodash';
import {
  buildHistoryStep,
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
  const unusedResult = unusedItems.map((entity) => ({ entity, pickerHistory: history }));

  const currentStepReturn = { key: currentKey, unused: unusedResult };

  if (!nestedPicker || !currentPickerEnabled) {
    return [currentStepReturn];
  }

  const unusedBranches = masterItems.map((masterItem, i) => {
    const mergedWorkingItems = workingItems?.reduce((acc, workingItem) => ({
      ...acc,
      ...workingItem,
      [nestedPicker]: [
        ...(acc[nestedPicker] ?? []),
        ...workingItem[nestedPicker],
      ],
    }), {});

    const nextHistory = [
      ...history,
      buildHistoryStep(currentKey, masterItem, i),
    ];

    return filterUnusedItems(
      masterItem,
      mergedWorkingItems,
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
  pickerHistory,
  matchingKey,
  referenceMatchState,
  moveEntity,
  fluid = undefined,
}) {
  const [modalPayload, setModalPayload] = useState(null);

  const onModalClose = useCallback(() => {
    setModalPayload(null);
  }, [setModalPayload]);

  const autoInsertNavigation = useMemo(() => {
    const autoInsertTarget = pickerHistory[pickerHistory.length - 1];

    return searchRecursive(referenceMatchState, autoInsertTarget);
  }, [pickerHistory, referenceMatchState]);

  return (
    <>
      <Button.Group compact fluid={fluid}>
        {autoInsertNavigation && (
          <Button
            positive
            basic
            icon="magic"
            content="Auto-Assign"
            onClick={() => moveEntity(entity, autoInsertNavigation)}
          />
        )}
        <Button
          primary
          basic
          icon="pen"
          content="Manual"
          onClick={() => setModalPayload(entity)}
        />
      </Button.Group>
      <MoveMatchingEntityModal
        key={modalPayload?.id}
        isOpen={modalPayload !== null}
        onClose={onModalClose}
        onConfirm={moveEntity}
        selectedMatchingEntity={modalPayload}
        rootMatchState={referenceMatchState}
        pickerHistory={pickerHistory}
        matchingKey={matchingKey}
        isAddMode
      />
    </>
  );
}

function UnusedEntitiesPanel({
  matchingKey,
  unusedEntries,
  dispatchMatchState,
  rootMatchState,
}) {
  const {
    computeCellName,
    computeCellDetails,
    cellDetailsAreData = false,
  } = matchingDndConfig[matchingKey];

  const { headerLabel } = pickerLocalizationConfig[matchingKey];

  const addBackEntity = useCallback((entity, pickerHistory) => dispatchMatchState({
    type: 'addEntityToMatching',
    entity,
    pickerHistory,
    matchingKey,
  }), [dispatchMatchState, matchingKey]);

  if (unusedEntries.length === 0) {
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
          {unusedEntries.map(({ entity, pickerHistory }) => (
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
                  pickerHistory={pickerHistory}
                  matchingKey={matchingKey}
                  referenceMatchState={rootMatchState}
                  moveEntity={addBackEntity}
                  fluid
                />
              </Card.Content>
            </Card>
          ))}
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

  const unusedPickerEntities = useMemo(
    () => filterUnusedItems(scrambleFilesTree, matchState),
    [scrambleFilesTree, matchState],
  );

  const anyUnusedEntries = unusedPickerEntities.some((step) => step.unused.length > 0);

  return (
    <>
      {anyUnusedEntries && <Divider />}
      {unusedPickerEntities.map((unusedStep) => (
        <UnusedEntitiesPanel
          key={unusedStep.key}
          matchingKey={unusedStep.key}
          unusedEntries={unusedStep.unused}
          dispatchMatchState={dispatchMatchState}
          rootMatchState={matchState}
        />
      ))}
    </>
  );
}
