import React, {
  useEffect, useMemo, useState,
} from 'react';
import {
  Accordion,
  Button,
  Form, Icon,
  Message,
  Segment,
  Transition,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import Markdown from '../../Markdown';

export default function RegistrationRequirements({ nextStep, competitionInfo }) {
  const [generalInfoAcknowledged, setGeneralInfoAcknowledged] = useCheckboxState(false);
  const [regRequirementsAcknowledged, setRegRequirementsAcknowledged] = useCheckboxState(false);

  const [showRegRequirements, setShowRegRequirements] = useState(false);

  const handleAccordionClick = () => {
    setShowRegRequirements((oldShowRegRequirements) => !oldShowRegRequirements);
  };

  const buttonDisabled = useMemo(() => (
    !generalInfoAcknowledged
      || (competitionInfo.extra_registration_requirements
        && !regRequirementsAcknowledged)
  ), [
    competitionInfo.extra_registration_requirements,
    generalInfoAcknowledged,
    regRequirementsAcknowledged,
  ]);

  useEffect(() => {
    if (generalInfoAcknowledged) {
      setShowRegRequirements(true);
    }
  }, [generalInfoAcknowledged, setShowRegRequirements]);

  return (
    <Segment basic>
      <Form onSubmit={nextStep}>
        <Form.Checkbox
          checked={generalInfoAcknowledged}
          onClick={setGeneralInfoAcknowledged}
          label={I18n.t('competitions.registration_v2.requirements.acknowledgement')}
          required
        />
        {competitionInfo.extra_registration_requirements && (
          <Accordion as={Form.Field} styled fluid>
            <Accordion.Title active index={0} onClick={handleAccordionClick}>
              <Icon name="dropdown" />
              {I18n.t(
                'competitions.competition_form.labels.registration.extra_requirements',
              )}
            </Accordion.Title>
            <Transition
              visible={showRegRequirements}
              animation="scale"
              duration={500}
            >
              <Accordion.Content active={showRegRequirements}>
                <Markdown
                  id={`registration-requirements-${competitionInfo.id}`}
                  md={competitionInfo.extra_registration_requirements}
                />
                <Message positive>
                  <Form.Checkbox
                    checked={regRequirementsAcknowledged}
                    onClick={setRegRequirementsAcknowledged}
                    label={I18n.t(
                      'competitions.registration_v2.requirements.acknowledgment_extra',
                    )}
                    required
                  />
                </Message>
              </Accordion.Content>
            </Transition>
          </Accordion>
        )}
        <Button disabled={buttonDisabled} type="submit" positive>
          {I18n.t('competitions.registration_v2.requirements.next_step')}
        </Button>
      </Form>
    </Segment>
  );
}
