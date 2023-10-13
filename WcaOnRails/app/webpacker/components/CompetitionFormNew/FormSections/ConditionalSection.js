import React from 'react';
import { Container, Transition } from 'semantic-ui-react';

function ConditionalSection({
  showIf,
  children,
}) {
  return (
    <Transition visible={showIf} animation="slide down">
      <Container fluid className="field">
        {children}
      </Container>
    </Transition>
  );
}

export default ConditionalSection;
