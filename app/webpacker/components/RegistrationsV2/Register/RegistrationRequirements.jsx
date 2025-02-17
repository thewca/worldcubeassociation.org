import React from 'react';
import {
  Button,
  Form,
  Message,
  Segment,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

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

export default function RegistrationRequirements({ nextStep, competitionInfo }) {
  const [infoAcknowledged, setInfoAcknowledged] = useCheckboxState(false);

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
