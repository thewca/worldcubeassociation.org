import React, { useEffect } from 'react';
import {
  Button,
  Container,
  Form,
  Modal,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import I18n from '../../../lib/i18n';
import useInputState from '../../../lib/hooks/useInputState';

const otherActivityCodes = [
  'other-registration',
  'other-checkin',
  'other-tutorial',
  'other-multi',
  'other-breakfast',
  'other-lunch',
  'other-dinner',
  'other-awards',
  'other-misc',
];

const otherActivityCodeOptions = otherActivityCodes
  .map((activityCode) => ({
    key: activityCode,
    text: I18n.t(`activity.${activityCode.substring(6)}`),
    value: activityCode,
  }));

function EditActivityModal({
  isModalOpen,
  activity,
  startLuxon,
  endLuxon,
  dateLocale,
  onModalClose,
  onModalSave,
}) {
  const [activityCode, setActivityCode] = useInputState();
  const [activityName, setActivityName] = useInputState();

  const setActivityCodeInternal = (evt, data) => {
    const { value: newActivityCode } = data;

    // only if there is no name yet: assign a default name based on the activity code
    if (!activityName && newActivityCode) {
      setActivityName(I18n.t(`activity.${newActivityCode.substring(6)}`));
    }

    setActivityCode(evt, data);
  };

  // We have to assign state in this awkward way because of an opinionated conflict
  //   between FullCalendar and SemanticUI. See comment at the beginning of index.js for details.
  useEffect(() => {
    setActivityCode(activity?.activityCode);
    setActivityName(activity?.name);
  }, [activity, setActivityCode, setActivityName]);

  const closeModalAndCleanUp = () => {
    onModalClose();
    setActivityCode(undefined);
    setActivityName(undefined);
  };

  return (
    <Modal
      open={isModalOpen}
      dimmer="blurring"
    >
      <Modal.Header>Add a custom activity</Modal.Header>
      <Modal.Content as={Form}>
        <Form.Select
          label="Type of activity"
          name="activity-type"
          options={otherActivityCodeOptions}
          value={activityCode}
          onChange={setActivityCodeInternal}
        />
        <Form.Input
          label="Name"
          name="activity-name"
          value={activityName}
          onChange={setActivityName}
        />
        <Container text>
          On
          {' '}
          {startLuxon?.setLocale(dateLocale)?.toLocaleString(DateTime.DATE_HUGE)}
          {' '}
          from
          {' '}
          {startLuxon?.setLocale(dateLocale)?.toLocaleString(DateTime.TIME_SIMPLE)}
          {' '}
          until
          {' '}
          {endLuxon?.setLocale(dateLocale)?.toLocaleString(DateTime.TIME_SIMPLE)}
        </Container>
      </Modal.Content>
      <Modal.Actions>
        <Button
          icon="save"
          content="Save"
          positive
          onClick={() => {
            onModalSave({ activityCode, activityName });
            closeModalAndCleanUp();
          }}
        />
        <Button
          icon="cancel"
          content="Cancel"
          negative
          onClick={closeModalAndCleanUp}
        />
      </Modal.Actions>
    </Modal>
  );
}

export default EditActivityModal;
