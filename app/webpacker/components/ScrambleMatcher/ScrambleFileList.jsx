import React, { useCallback, useMemo, useState } from 'react';
import {
  Accordion, Breadcrumb, Button, Header, Icon, Popup, Table,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { scrambleFileUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import {
  groupScrambleSetsIntoWcif,
  matchingDndConfig,
  pickerLocalizationConfig,
  pickerStepConfig,
  searchRecursive,
} from './util';
import { events } from '../../lib/wca-data.js.erb';
import { getFullDateTimeString } from '../../lib/utils/dates';
import MoveMatchingEntityModal from './MoveMatchingEntityModal';

async function deleteScrambleFile({ fileId }) {
  const { data } = await fetchJsonOrError(scrambleFileUrl(fileId), {
    method: 'DELETE',
  });

  return data;
}

const DUMMY_ENTITY_ID = 0;
const DUMMY_ENTITY = { id: DUMMY_ENTITY_ID };
const DUMMY_ENTITY_SET = [DUMMY_ENTITY];

function navToDefCellContent(navigationStep) {
  const {
    computeCellName,
    computeTableName = computeCellName,
  } = matchingDndConfig[navigationStep.key] || {};

  switch (navigationStep.key) {
    case 'events':
      return (
        <Popup
          content={events.byId[navigationStep.id].name}
          trigger={<Icon size="large" className={`cubing-icon event-${navigationStep.id}`} />}
          position="top center"
        />
      );
    case 'rounds':
      return navigationStep.index + 1;
    default:
      return computeTableName(navigationStep.entity);
  }
}

function navToBreadcrumbContent(navigationStep) {
  switch (navigationStep.key) {
    case 'events':
      return (<Icon className={`cubing-icon event-${navigationStep.id}`} />);
    default:
      return pickerLocalizationConfig[navigationStep.key]
        ?.computeEntityName(navigationStep.id, navigationStep.index);
  }
}

function ScrambleFileHeader({ scrambleFile }) {
  return (
    <>
      {scrambleFile.original_filename}
      <Header.Subheader>
        Generated with
        {' '}
        {scrambleFile.scramble_program}
        <br />
        On
        {' '}
        {getFullDateTimeString(scrambleFile.generated_at)}
      </Header.Subheader>
    </>
  );
}

function HeadersForMatching({ matchingKey, previousMatching = undefined }) {
  const { dropdownLabel } = pickerLocalizationConfig[matchingKey];

  const {
    matchingConfigKey,
    nestedPicker = matchingConfigKey,
  } = pickerStepConfig[matchingKey] || {};

  return (
    <>
      <Table.HeaderCell collapsing>{dropdownLabel}</Table.HeaderCell>
      {previousMatching === matchingKey && (
        <Table.HeaderCell>Current Status</Table.HeaderCell>
      )}
      {nestedPicker && (
        <HeadersForMatching
          matchingKey={nestedPicker}
          previousMatching={matchingConfigKey}
        />
      )}
    </>
  );
}

function buildTableRows(
  matchingKey,
  matchEntity,
  previousMatching = undefined,
  nestingStillEnabled = true,
  history = [],
) {
  const {
    enabledCondition,
    matchingConfigKey,
    nestedPicker = matchingConfigKey,
  } = pickerStepConfig[matchingKey] || {};

  const currentStepEnabled = enabledCondition?.(history) ?? true;
  const tableStatusEnabled = currentStepEnabled && nestingStillEnabled;

  const entityRows = nestingStillEnabled ? matchEntity[matchingKey] : DUMMY_ENTITY_SET;

  return entityRows.flatMap((rowEntity, i) => {
    const nextHistory = [
      ...history,
      {
        key: matchingKey,
        id: rowEntity.id,
        entity: rowEntity,
        index: i,
        hasPicker: previousMatching === matchingKey,
      },
    ];

    if (nestedPicker) {
      return buildTableRows(
        nestedPicker,
        rowEntity,
        matchingConfigKey,
        tableStatusEnabled,
        nextHistory,
      );
    }

    return [nextHistory];
  });
}

function BodyForMatching({
  matchingKey,
  matchEntity,
  matchState,
  dispatchMatchState,
}) {
  const tableRows = buildTableRows(matchingKey, matchEntity);

  const [modalEntity, setModalEntity] = useState(null);

  const addAutomatic = useCallback((entity, pickerHistory, targetMatchingKey) => {
    dispatchMatchState({
      type: 'addEntityToMatching',
      pickerHistory,
      matchingKey: targetMatchingKey,
      entity,
    });
  }, [dispatchMatchState]);

  return tableRows.map((rowHistory, rowIdx, allRows) => (
    <Table.Row key={rowHistory.reduce((acc, step) => [...acc, step.id], []).join('-')}>
      {rowHistory.map((step, stepIdx, allSteps) => {
        const remainingSteps = allSteps.slice(stepIdx + 1);
        const isDefCell = remainingSteps.every((remStep) => remStep.index === 0);

        if (!isDefCell) {
          return null;
        }

        const defRowSpan = allRows
          .slice(rowIdx)
          .filter((laterRow) => laterRow[stepIdx].id === step.id)
          .length;

        const actualNavigation = searchRecursive(matchState, step);

        const autoInsertTarget = stepIdx > 0 ? allSteps[stepIdx - 1] : {};
        const autoInsertNavigation = searchRecursive(matchState, autoInsertTarget);

        const reactKey = `${step.key}-${step.id}`;

        if (step.id === DUMMY_ENTITY_ID) {
          if (stepIdx > 0 && allSteps[stepIdx - 1].id === DUMMY_ENTITY_ID) {
            return null;
          }

          const remainingColSpan = allSteps.slice(stepIdx)
            .reduce((sum, remStep) => sum + (remStep.hasPicker ? 2 : 1), 0);

          return (
            <Table.Cell
              textAlign="center"
              verticalAlign="middle"
              singleLine
              colSpan={remainingColSpan}
              disabled
            >
              (automatic)
            </Table.Cell>
          );
        }

        return (
          <React.Fragment key={reactKey}>
            <Table.Cell
              textAlign="center"
              verticalAlign="middle"
              singleLine
              rowSpan={defRowSpan}
            >
              {navToDefCellContent(step)}
            </Table.Cell>
            {step.hasPicker && (
            <>
              <Table.Cell
                textAlign="center"
                verticalAlign="middle"
                rowSpan={defRowSpan}
              >
                {actualNavigation ? (
                  <Breadcrumb size="tiny">
                    {actualNavigation.map((nav, breadIdx) => (
                      <React.Fragment key={nav.key}>
                        {breadIdx > 0 && (<Breadcrumb.Divider icon="chevron right" />)}
                        <Breadcrumb.Section>{navToBreadcrumbContent(nav)}</Breadcrumb.Section>
                      </React.Fragment>
                    ))}
                  </Breadcrumb>
                ) : (
                  <Button.Group fluid>
                    {autoInsertNavigation && (
                      <Button
                        positive
                        basic
                        compact
                        icon="magic"
                        content="Add to table"
                        onClick={() => addAutomatic(step.entity, autoInsertNavigation, step.key)}
                      />
                    )}
                    <Button
                      primary
                      basic
                      compact
                      icon="pen"
                      content="Manual"
                    />
                  </Button.Group>
                )}
              </Table.Cell>
              <MoveMatchingEntityModal
                key={modalEntity?.id}
                isOpen={modalEntity !== null}
                onClose={() => setModalEntity(null)}
                dispatchMatchState={dispatchMatchState}
                selectedMatchingEntity={modalEntity}
                rootMatchState={matchState}
                pickerHistory={allSteps.slice(0, stepIdx + 1)}
                matchingKey={step.key}
              />
            </>
            )}
          </React.Fragment>
        );
      })}
    </Table.Row>
  ));
}

function ScrambleFileBody({
  scrambleFile,
  matchState,
  dispatchMatchState,
}) {
  const queryClient = useQueryClient();

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteScrambleFile,
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['scramble-files', data.competition_id],
        (prev) => prev.filter((scrFile) => scrFile.id !== data.id),
      );

      dispatchMatchState({ type: 'removeScrambleFile', scrambleFile: data });
    },
  });

  const deleteAction = useCallback(
    () => deleteMutation({ fileId: scrambleFile.id }),
    [deleteMutation, scrambleFile.id],
  );

  const scrambleFileTree = useMemo(
    () => groupScrambleSetsIntoWcif(scrambleFile.inbox_scramble_sets),
    [scrambleFile.inbox_scramble_sets],
  );

  return (
    <>
      <Table celled structured compact>
        <Table.Header>
          <Table.Row textAlign="center" verticalAlign="middle">
            <HeadersForMatching matchingKey="events" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <BodyForMatching
            matchingKey="events"
            matchEntity={scrambleFileTree}
            matchState={matchState}
            dispatchMatchState={dispatchMatchState}
          />
        </Table.Body>
      </Table>
      <Button
        fluid
        negative
        icon="trash"
        content="Delete"
        onClick={deleteAction}
        disabled={isDeleting}
        loading={isDeleting}
      />
    </>
  );
}

export default function ScrambleFileList({
  scrambleFiles,
  isFetching,
  matchState,
  dispatchMatchState,
}) {
  if (isFetching) {
    return <Loading />;
  }

  const panels = scrambleFiles.map((scrFile) => ({
    key: scrFile.id,
    title: {
      as: Header,
      content: <ScrambleFileHeader scrambleFile={scrFile} />,
    },
    content: {
      content: <ScrambleFileBody
        scrambleFile={scrFile}
        matchState={matchState}
        dispatchMatchState={dispatchMatchState}
      />,
    },
  }));

  return (
    <Accordion styled fluid panels={panels} />
  );
}
