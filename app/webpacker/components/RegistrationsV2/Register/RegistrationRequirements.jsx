import React from 'react';
import {
  Button,
  Form,
  Message,
  Segment,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';

export default function RegistrationRequirements({ nextStep }) {
  const [infoAcknowledged, setInfoAcknowledged] = useCheckboxState(false);

  return (
    <Segment basic>
      <Form onSubmit={nextStep}>
        <Message positive>
          <Form.Checkbox
            checked={infoAcknowledged}
            onClick={setInfoAcknowledged}
            label={I18n.t('competitions.registration_v2.requirements.acknowledgement')}
            required
          />
        </Message>
        <Button disabled={!infoAcknowledged} type="submit" positive>
          {I18n.t('competitions.registration_v2.requirements.next_step')}
        </Button>
      </Form>
    </Segment>
  );
}
