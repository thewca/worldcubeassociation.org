import { UiIcon } from '@thewca/wca-components';
import { marked } from 'marked';
import React, {
  useContext, useEffect, useMemo, useState,
} from 'react';
import {
  Accordion,
  Button,
  Form,
  Message,
  Segment,
  Transition,
} from 'semantic-ui-react';
import { CompetitionContext } from '../Context/competition_context';
import I18n from '../../../lib/i18n';

export default function RegistrationRequirements({ nextStep }) {
  const { competitionInfo } = useContext(CompetitionContext);

  const [generalInfoAcknowledged, setGeneralInfoAcknowledged] = useState(false);
  const [regRequirementsAcknowledged, setRegRequirementsAcknowledged] = useState(false);

  const [showRegRequirements, setShowRegRequirements] = useState(false);

  const setFromCheckbox = (data, setState) => {
    const { checked } = data;
    setState(checked);
  };

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
          onClick={(_, data) => setFromCheckbox(data, setGeneralInfoAcknowledged)}
          label={I18n.t('competitions.registration_v2.requirements.acknowledgement')}
          required
        />
        {competitionInfo.extra_registration_requirements && (
          <Accordion as={Form.Field} styled fluid>
            <Accordion.Title active index={0} onClick={handleAccordionClick}>
              <UiIcon name="dropdown" />
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
                <p
                  dangerouslySetInnerHTML={{
                    __html: marked(
                      competitionInfo.extra_registration_requirements,
                    ),
                  }}
                />
                <Message positive>
                  <Form.Checkbox
                    checked={regRequirementsAcknowledged}
                    onClick={(_, data) => setFromCheckbox(data, setRegRequirementsAcknowledged)}
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
