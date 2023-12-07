import React, { useEffect } from 'react';
import {
  Button,
  Container,
  Form,
  Modal,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import useInputState from '../../../lib/hooks/useInputState';

const commonActivityCodes = {
  'other-registration': 'On-site registration',
  'other-checkin': 'Check-in',
  'other-tutorial': 'Tutorial for new competitors',
  'other-multi': 'Cube submission for 3x3x3 Multi-Blind',
  'other-breakfast': 'Breakfast',
  'other-lunch': 'Lunch',
  'other-dinner': 'Dinner',
  'other-awards': 'Awards',
  'other-misc': 'Other',
};

const otherActivityCodeOptions = Object.entries(commonActivityCodes)
  .map(([activityCode, description]) => ({
    key: activityCode,
    text: description,
    value: activityCode,
  }));

function EditActivityModal({
  isModalOpen,
  activity,
  startLuxon,
  endLuxon,
  onModalClose,
  dateLocale,
}) {
  const [activityCode, setActivityCode] = useInputState();
  const [activityName, setActivityName] = useInputState();

  const setActivityCodeInternal = (evt, data) => {
    const { value: newActivityCode } = data;

    // only if there is no name yet: assign a default name based on the activity code
    if (!activityName && newActivityCode) {
      setActivityName(commonActivityCodes[newActivityCode]);
    }

    setActivityCode(evt, data);
  };

  // We have to assign state in this awkward way because of an opinionated conflict
  //   between FullCalendar and SemanticUI. See comment at the beginning of index.js for details.
  useEffect(() => {
    setActivityCode(activity?.activityCode);
    setActivityName(activity?.name);
  }, [activity, setActivityCode, setActivityName]);

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
          onClick={() => onModalClose(true, { activityCode, activityName })}
        />
        <Button
          icon="cancel"
          content="Cancel"
          negative
          onClick={() => onModalClose(false, { activityCode, activityName })}
        />
      </Modal.Actions>
    </Modal>
  );
}

export default EditActivityModal;
