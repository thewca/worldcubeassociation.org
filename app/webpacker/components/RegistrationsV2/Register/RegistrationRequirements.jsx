import React from 'react';
import {
  Button,
  Form,
  Message,
  Segment,
} from 'semantic-ui-react';
import i18n from '../../../lib/i18n';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

export default function RegistrationRequirements({ nextStep, competitionInfo }) {
  const [infoAcknowledged, setInfoAcknowledged] = useCheckboxState(false);
  return (
    <Segment basic>
      <Form onSubmit={nextStep} warning={competitionInfo['registration_full?']}>
        {competitionInfo['registration_full?'] && (
        <Message warning>
          <I18nHTMLTranslate i18nKey="registrations.registration_full" options={{ competitor_limit: competitionInfo.competitor_limit }} />
        </Message>
        ) }
        <Message positive>
          <Form.Checkbox
            checked={infoAcknowledged}
            onClick={setInfoAcknowledged}
            label={i18n.t('competitions.registration_v2.requirements.acknowledgement')}
            required
          />
        </Message>
        <Button disabled={!infoAcknowledged} type="submit" positive>
          {i18n.t('competitions.registration_v2.requirements.next_step')}
        </Button>
      </Form>
    </Segment>
  );
}
