import React, { useMemo } from 'react';
import { Label, Transition } from 'semantic-ui-react';
import { CONNECTION_COLORS, CONNECTION_STATE_CONNECTED } from '../hooks/useResultsSubscription';
import usePerpetualState from '../../RegistrationsV2/hooks/usePerpetualState';

const PULSE_DURATION = 2000;

export default function ConnectionPulse({ connectionState, animationDuration = PULSE_DURATION }) {
  const animationPulse = usePerpetualState((prev) => !prev, animationDuration * 1.5);

  const connectionColor = useMemo(() => CONNECTION_COLORS[connectionState], [connectionState]);

  const isConnected = useMemo(
    () => connectionState === CONNECTION_STATE_CONNECTED,
    [connectionState],
  );

  return (
    <Transition animation="flash" duration={animationDuration} visible={!isConnected || animationPulse}>
      <Label circular empty color={connectionColor} />
    </Transition>
  );
}
