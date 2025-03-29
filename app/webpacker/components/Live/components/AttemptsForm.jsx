import React, { useMemo } from 'react';
import { Form, Header, Message } from 'semantic-ui-react';
import _ from 'lodash';
import AttemptResultField from '../../EditResult/WCALive/AttemptResultField/AttemptResultField';

export default function AttemptsForm({
  registrationId,
  handleRegistrationIdChange,
  competitors,
  solveCount,
  eventId,
  attempts,
  handleAttemptChange,
  handleSubmit,
  error,
  success,
  header,
}) {
  const options = useMemo(() => competitors.map((p) => ({
    key: p.id,
    value: p.id,
    registrationId: p.registration_id,
    text: `${p.user.name} (${p.registration_id})`,
  })), [competitors]);

  return (
    <Form error={!!error} success={!!success}>
      <Header>
        {header}
      </Header>

      {error && <Message error content={error} />}
      {success && <Message success content={success} />}
      <Form.Select
        label="Competitor"
        placeholder="Competitor"
        value={registrationId}
        deburr
        search={(inputs, value) => inputs.filter((d) => d.text.includes(value)
          || parseInt(value, 10) === d.registrationId)}
        onChange={handleRegistrationIdChange}
        options={options}
      />
      {_.times(solveCount).map((index) => (
        <AttemptResultField
          eventId={eventId}
          key={index}
          label={`Attempt ${index + 1}`}
          placeholder="Time in milliseconds or DNF"
          value={attempts[index] ?? 0}
          onChange={(value) => handleAttemptChange(index, value)}
        />
      ))}
      <Form.Button primary onClick={handleSubmit}>Submit Results</Form.Button>
    </Form>
  );
}
