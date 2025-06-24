import React from 'react';
import { Input, Button, Form, Icon, Message } from 'semantic-ui-react';
import useInputState from '../../lib/hooks/useInputState';
import { useMutation } from '@tanstack/react-query';
import { updateTestLink, promoteTestLink } from './api/livestream';

function LivestreamManager({ inputTestLink, inputLiveLink }) {
  const [testLink, setTestLink] = useInputState(inputTestLink);
  const [liveLink, setLiveLink] = useInputState(inputLiveLink);
  const [testLinkInput, setTestLinkInput] = useInputState("");

  const { mutate: updateTestLinkMutation, isSuccess: testLinkUpdated, error: testLinkUpdateError } = useMutation({
    mutationFn: updateTestLink,
    onSuccess: ({data}) => {
      setTestLink(data);
    },
  });

  const { mutate: promoteTestLinkMutation, isSuccess: liveLinkUpdate, error: liveLinkUpdateError } = useMutation({
    mutationFn: promoteTestLink,
    onSuccess: ({data}) => {
      setLiveLink(data);
    },
  });

  return (
    <>
      <h1>Livestream Management</h1>
      <p>Use this page to manage the livestream displayed on the WCA homepage. Update the link by following the steps below.</p>

      <b><p>Current links:</p></b>
      <ul>
        <li><b>Test link</b>: {testLink}</li>
        <li><b>Live link link</b>: {liveLink}</li>
      </ul>

      <h2>Step 1: Update the Test Link</h2>
      <Form onSubmit={() => updateTestLinkMutation(testLinkInput)} success={testLinkUpdated} error={!!testLinkUpdateError}>
        <Form.Field>
          <label>New Test Link</label>
          <Input
            placeholder="Enter new test link"
            value={testLinkInput}
            onChange={(e) => setTestLinkInput(e.target.value)}
          />
        </Form.Field>
        <Button primary type="submit">Submit</Button>

        <Message success content="Test link updated!" />
        <Message error content={testLinkUpdateError?.message || 'Something went wrong'} />
      </Form>

      <h2>Step 2: Check the Homepage Preview</h2>
      <a href="/wc2025-preview">Click here</a>
      <p>This is a preview</p>

      <h2>Step 3: Update the Homepage Livestream Link</h2>
      <p>This will update the link used on the public-facing homepage. Make sure you've checked the Homepage Preview first!</p>

      <Button
        color="red"
        onClick={() => promoteTestLinkMutation()}
      >
        <Icon name="exclamation triangle" />
        {' '}
        {'Update Public Livestream Link'}
      </Button>
    </>
  );
}

export default LivestreamManager;
