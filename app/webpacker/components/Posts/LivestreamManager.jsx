import React from 'react';
import {
  Confirm, Input, Button, Form, Icon, List, ListItem, Message, Segment,
} from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import useInputState from '../../lib/hooks/useInputState';
import { updateTestLink, promoteTestLink } from './api/livestream';

function LivestreamManager({ inputTestLink, inputLiveLink }) {
  const [testLink, setTestLink] = useInputState(inputTestLink);
  const [liveLink, setLiveLink] = useInputState(inputLiveLink);
  const [testLinkInput, setTestLinkInput] = useInputState('');
  const [pendingSubmissionValue, setPendingSubmissionValue] = useInputState(null);
  const [confirmUpdateOpen, setConfirmUpdateOpen] = useInputState(false);
  const [confirmPromoteOpen, setConfirmPromoteOpen] = useInputState(false);

  const {
    mutate: updateTestLinkMutation,
    isSuccess: testLinkUpdated,
    error: testLinkUpdateError,
  } = useMutation({
    mutationFn: updateTestLink,
    onSuccess: ({ data }) => {
      setTestLink(data);
    },
  });

  const {
    mutate: promoteTestLinkMutation,
    isSuccess: liveLinkUpdated,
    error: liveLinkUpdateError,
  } = useMutation({
    mutationFn: promoteTestLink,
    onSuccess: ({ data }) => {
      setLiveLink(data);
    },
  });

  const handleSubmit = (value) => {
    setPendingSubmissionValue(value);
    setConfirmUpdateOpen(true);
  };

  const confirmUpdateSubmission = () => {
    updateTestLinkMutation(pendingSubmissionValue);
    // In case the submission comes from one of the non-"Submit" buttons
    setTestLinkInput(pendingSubmissionValue);
    setConfirmUpdateOpen(false);
    setPendingSubmissionValue(null);
  };

  const submitPromote = () => {
    promoteTestLinkMutation();
    setConfirmPromoteOpen(false);
  };

  return (
    <Container>
      <h1>Livestream Management</h1>
      <p>Use this page to manage the livestream displayed on the WCA homepage</p>
      <List bulleted>
        <ListItem>Update the chosen VideoID by following the steps below</ListItem>
        <ListItem>
          The WC2025 banner will disappear if the &quot;Live videoId&quot; ever becomes blank
        </ListItem>
        <ListItem>
          {'The live videoId can\'t be updated directly - you have to set the test videoId first (Step 1),'
          + 'and then overwrite the live videoId with its value (Step 3)'}
        </ListItem>
      </List>

      <b><p>Current VideoID&apos;s:</p></b>
      <List bulleted>
        <ListItem>
          <b>Test videoId</b>
          :
          {' '}
          {testLink}
        </ListItem>
        <ListItem>
          <b>Live videoId</b>
          :
          {' '}
          {liveLink}
        </ListItem>
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
          onSubmit={() => handleSubmit(testLinkInput)}
          success={testLinkUpdated}
          error={!!testLinkUpdateError}
        >
          <Form.Field>
            <Input
              label="New videoId"
              placeholder="Enter VideoID to test"
              value={testLinkInput}
              onChange={(e) => setTestLinkInput(e.target.value)}
            />
          </Form.Field>

          <Button primary type="submit">Submit</Button>

          <Message success content={`Test videoId updated! New value: ${testLink}`} />
          <Message error content={testLinkUpdateError?.message || 'Something went wrong'} />

          <p>Or use one of these default options:</p>
          <Button
            type="button"
            color="green"
            onClick={() => handleSubmit('blat80pyeBg')}
          >
            <Icon name="play" />
            {' '}
            Use WC2025 Promo Video
          </Button>

          <Button
            type="button"
            color="red"
            onClick={() => handleSubmit('')}
          >
            <Icon name="low vision" />
            {' '}
            Clear Video Link
          </Button>
        </Form>
      </Segment>

      <Segment>
        <h2>Step 2: Check the Homepage Preview</h2>
        <p>
          {'Before we update the video on the homepage, let\'s make sure that'
          + 'you\'ve entered the link correctly for the new video you want.'}
        </p>

        <p>
          <a href="/wc2025-preview" target="_blank" rel="noopener noreferrer">Click here</a>
          {' '}
          to see a preview of the homepage.
        </p>
        <p>Please confirm the following:</p>
        <List bulleted>
          <ListItem>The correct video is loaded</ListItem>
          <ListItem>
            {'The video autoplays (hint: If not, make sure that your videoId stopped at the'
            + 'question mark in the youtube link)'}
          </ListItem>
        </List>
      </Segment>

      <Segment>
        <Form
          onSubmit={() => setConfirmPromoteOpen(true)}
          success={liveLinkUpdated}
          error={!!liveLinkUpdateError}
        >
          <h2>Step 3: Update the Homepage Livestream Link</h2>
          <p>
            {'This will update the link used on the public-facing homepage.'
             + 'Make sure you\'ve checked the Homepage Preview first!'}
          </p>

          <Button
            color="red"
            type="submit"
          >
            <Icon name="exclamation triangle" />
            {' '}
            Update Public Livestream Link
          </Button>

          <Message success content={`Live videoId updated! New value: ${testLink}`} />
          <Message error content={liveLinkUpdateError?.message || 'Something went wrong'} />
        </Form>
      </Segment>

      <Segment>
        <h3>[1] How do I find the videoId?</h3>
        <List ordered>
          <ListItem>Go to the video you want to use, and click &quot;Share&quot;.</ListItem>
          <ListItem>The link will look like this: https://youtu.be/fiqMMsCuSq8?si=PYUK2ftPOPQy36Su</ListItem>
          <ListItem>
            We only want the part after &quot;be/&quot; and before the first question mark - highlighted in bold: https://youtu.be/
            <b>fiqMMsCuSq8</b>
            ?si=PYUK2ftPOPQy36Su
          </ListItem>
          <ListItem>
            Paste only that part -
            <b>fiqMMsCuSq8</b>
            {' '}
            - into the box in Step 1
          </ListItem>
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
          testLink === ''
            ? 'WARNING! You are submitting a blank videoId - this will hide the WC2025 banner and return the homepage to nornmal. Are you sure?'
            : `Are you sure you want to submit this VideoID: ${testLink}?`
        }
      />

    <Container/>
  );
}



export default LivestreamManager;
