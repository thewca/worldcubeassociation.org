import React, { useEffect } from 'react';
import {
  Button,
  Form,
  Message,
  Segment,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import useSteps from '../hooks/useSteps';
import { useRegistration } from '../lib/RegistrationProvider';

function RegistrationFullMessage({ competitionInfo }) {
  if (competitionInfo['registration_full_and_accepted?']) {
    return (
      <Message warning>
        <I18nHTMLTranslate i18nKey="registrations.registration_full" options={{ competitor_limit: competitionInfo.competitor_limit }} />
      </Message>
    );
  }

  if (competitionInfo['registration_full?']) {
    return (
      <Message warning>
        <I18nHTMLTranslate i18nKey="registrations.registration_full_include_waiting_list" options={{ competitor_limit: competitionInfo.competitor_limit }} />
      </Message>
    );
  }

  return null;
}

export default function RegistrationRequirements({ competitionInfo }) {
  const [infoAcknowledged, setInfoAcknowledged] = useCheckboxState(false);
  const { jumpToStepByKey, nextStep, jumpToFirstIncompleteStep } = useSteps();
  const { isAccepted, isRejected, isRegistered } = useRegistration();

  useEffect(() => {
    if (isAccepted || isRejected) {
      jumpToStepByKey('approval');
    } else if (isRegistered) {
      jumpToFirstIncompleteStep();
    }
  }, [jumpToStepByKey, isAccepted, isRejected, isRegistered, jumpToFirstIncompleteStep]);

  return (
    <Segment basic>
      <Form onSubmit={nextStep} warning={competitionInfo['registration_full?']}>
        <RegistrationFullMessage competitionInfo={competitionInfo} />
        <Message positive>
          <Form.Checkbox
            id="regRequirementsCheckbox"
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
