import React from 'react';
import {
  Confirm, Container, Input, Button, Header, Form, Icon, List, Message, Segment,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import useInputState from '../../lib/hooks/useInputState';
import { updateTestVideoId, promoteTestVideoId } from './api/livestream';

function LivestreamManager({ testVideoIdProp, liveVideoIdProp }) {
  const [testVideoId, setTestVideoId] = useInputState(testVideoIdProp);
  const [liveVideoId, setLiveVideoId] = useInputState(liveVideoIdProp);
  const [testVideoIdInput, setTestVideoIdInput] = useInputState('');
  const [pendingSubmissionValue, setPendingSubmissionValue] = useInputState(null);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useInputState(false);
  const [confirmPromoteOpen, setConfirmPromoteOpen] = useInputState(false);

  const defaultVideoId = 'blat80pyeBg';

  const {
    mutate: updateTestVideoIdMutation,
    isSuccess: testVideoIdUpdated,
    error: testVideoIdUpdateError,
  } = useMutation({
    mutationFn: updateTestVideoId,
    onSuccess: ({ data }) => {
      setTestVideoId(data);
    },
  });

  const {
    mutate: promoteTestVideoIdMutation,
    isSuccess: liveVideoIdUpdated,
    error: liveVideoIdUpdateError,
  } = useMutation({
    mutationFn: promoteTestVideoId,
    onSuccess: ({ data }) => {
      setLiveVideoId(data);
    },
  });

  const handleSubmit = (value) => {
    setPendingSubmissionValue(value);
    setConfirmUpdateOpen(true);
  };

  const confirmUpdateSubmission = () => {
    updateTestVideoIdMutation(pendingSubmissionValue);
    // In case the submission comes from one of the non-"Submit" buttons
    setTestVideoIdInput(pendingSubmissionValue);
    setConfirmUpdateOpen(false);
    setPendingSubmissionValue(null);
  };

  const submitPromote = () => {
    promoteTestVideoIdMutation();
    setConfirmPromoteOpen(false);
  };

  return (
    <Container>
      <Header>Livestream Management</Header>
      <p>Use this page to manage the livestream displayed on the WCA homepage</p>
      <List bulleted>
        <List.Item>Update the chosen VideoID by following the steps below</List.Item>
        <List.Item>
          The WC2025 banner will disappear if the &quot;Live videoId&quot; ever becomes blank
        </List.Item>
        <List.Item>
          {'The live videoId can\'t be updated directly - you have to set the test videoId first (Step 1),'
          + 'and then overwrite the live videoId with its value (Step 3)'}
        </List.Item>
      </List>

      <b><p>Current VideoID&apos;s:</p></b>
      <List bulleted>
        <List.Item>
          <b>Test videoId</b>
          :
          {' '}
          {testVideoId}
        </List.Item>
        <List.Item>
          <b>Live videoId</b>
          :
          {' '}
          {liveVideoId}
        </List.Item>
      </List>

      <Segment>
        <h2>Step 1: Update the Test VideoID</h2>
        <p>
          You can either input a VideoID manually[1]:
          <i>
            (Note - we don&apos;t check that the VideoID is valid! That&apos;s your job in Step 2.)
          </i>
        </p>
        <Form
          onSubmit={() => handleSubmit(testVideoIdInput)}
          success={testVideoIdUpdated}
          error={!!testVideoIdUpdateError}
        >
          <Form.Field>
            <Input
              label="New videoId"
              placeholder="Enter VideoID to test"
              value={testVideoIdInput}
              onChange={(e) => setTestVideoIdInput(e.target.value)}
            />
          </Form.Field>

          <Button primary type="submit" disabled={testVideoId === testVideoIdInput}>Submit</Button>

          <Message success content={`Test videoId updated! New value: ${testVideoId}`} />
          <Message error content={testVideoIdUpdateError?.message || 'Something went wrong'} />

          <p>Or use one of these default options:</p>
          <Button
            type="button"
            color="green"
            onClick={() => handleSubmit(defaultVideoId)}
            disabled={testVideoId === defaultVideoId}
          >
            <Icon name="play" />
            {' '}
            Use WC2025 Promo Video
          </Button>

          <Button
            type="button"
            color="red"
            onClick={() => handleSubmit('')}
            disabled={testVideoId === ''}
          >
            <Icon name="low vision" />
            {' '}
            Clear VideoId
          </Button>
        </Form>
      </Segment>

      <Segment>
        <h2>Step 2: Check the Homepage Preview</h2>
        <p>
          {'Before we update the video on the homepage, let\'s make sure that'
          + 'you\'ve entered the videoId correctly for the new video you want.'}
        </p>

        <p>
          <a href="/?preview=1" target="_blank" rel="noopener noreferrer">Click here</a>
          {' '}
          to see a preview of the homepage.
        </p>
        <p>Please confirm the following:</p>
        <List bulleted>
          <List.Item>The correct video is loaded</List.Item>
          <List.Item>
            {'The video autoplays (hint: If not, make sure that your videoId stopped at the '
            + 'question mark in the youtube link)'}
          </List.Item>
        </List>
      </Segment>

      <Segment>
        <Form
          onSubmit={() => setConfirmPromoteOpen(true)}
          success={liveVideoIdUpdated}
          error={!!liveVideoIdUpdateError}
        >
          <h2>Step 3: Update the Homepage Livestream Link</h2>
          <p>
            {'This will update the link used on the public-facing homepage.'
             + 'Make sure you\'ve checked the Homepage Preview first!'}
          </p>

          <Button
            color="red"
            type="submit"
            disabled={testVideoId === liveVideoId}
          >
            <Icon name="exclamation triangle" />
            {' '}
            Update Public Livestream Link
          </Button>

          <Message success content={`Live videoId updated! New value: ${testVideoId}`} />
          <Message error content={liveVideoIdUpdateError?.message || 'Something went wrong'} />
        </Form>
      </Segment>

      <Segment>
        <h3>[1] How do I find the videoId?</h3>
        <List ordered>
          <List.Item>Go to the video you want to use, and click &quot;Share&quot;.</List.Item>
          <List.Item>The link will look like this: https://youtu.be/fiqMMsCuSq8?si=PYUK2ftPOPQy36Su</List.Item>
          <List.Item>
            We only want the part after &quot;be/&quot; and before the first question mark - highlighted in bold: https://youtu.be/
            <b>fiqMMsCuSq8</b>
            ?si=PYUK2ftPOPQy36Su
          </List.Item>
          <List.Item>
            Paste only that part -
            <b>fiqMMsCuSq8</b>
            {' '}
            - into the box in Step 1
          </List.Item>
        </List>
      </Segment>

      <Confirm
        open={confirmUpdateOpen}
        onCancel={() => setConfirmUpdateOpen(false)}
        onConfirm={confirmUpdateSubmission}
        content={`Are you sure you want to submit this VideoID: "${pendingSubmissionValue}"?`}
      />

      <Confirm
        open={confirmPromoteOpen}
        onCancel={() => setConfirmPromoteOpen(false)}
        onConfirm={submitPromote}
        content={
          testVideoId === ''
            ? 'WARNING! You are submitting a blank videoId - this will hide the WC2025 banner and return the homepage to nornmal. Are you sure?'
            : `Are you sure you want to submit this VideoID: ${testVideoId}?`
        }
      />
    </Container>
  );
}

function LivestreamManagerWrapper(
  { testVideoId, liveVideoId },
) {
  return (
    <WCAQueryClientProvider>
      <LivestreamManager testVideoIdProp={testVideoId} liveVideoIdProp={liveVideoId} />
    </WCAQueryClientProvider>
  );
}

export default LivestreamManagerWrapper;
