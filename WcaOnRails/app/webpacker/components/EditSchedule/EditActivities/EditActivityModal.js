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

const otherActivityCodeOptions = Object.keys(commonActivityCodes).map((activityCode) => ({
  key: activityCode,
  text: commonActivityCodes[activityCode],
  value: activityCode,
}));

function EditActivityModal({
  showModal,
  activity,
  startLuxon,
  endLuxon,
  onModalClose,
  dateLocale,
}) {
  const [activityCode, setActivityCode] = useInputState(activity?.activityCode);
  const [activityName, setActivityName] = useInputState(activity?.name);

  useEffect(() => {
    if (!activityName && activityCode) {
      setActivityName(commonActivityCodes[activityCode]);
    }
  }, [activityName, activityCode, setActivityName]);

  return (
    <Modal
      open={showModal}
      dimmer="blurring"
    >
      <Modal.Header>Add a custom activity</Modal.Header>
      <Modal.Content
        as={Form}
      >
        <Form.Select
          label="Type of activity"
          name="activity-type"
          options={otherActivityCodeOptions}
          value={activityCode}
          onChange={setActivityCode}
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
