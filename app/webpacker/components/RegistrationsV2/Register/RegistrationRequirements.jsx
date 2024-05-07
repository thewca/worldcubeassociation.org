import React, {
  useState,
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
  const [infoAcknowledged, setInfoAcknowledged] = useCheckboxState(false);
  const [showRegRequirements, setShowRegRequirements] = useState(false);

  const handleAccordionClick = () => {
    setShowRegRequirements((oldShowRegRequirements) => !oldShowRegRequirements);
  };

  return (
    <Segment basic>
      <Form onSubmit={nextStep}>
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
              </Accordion.Content>
            </Transition>
          </Accordion>
        )}
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
