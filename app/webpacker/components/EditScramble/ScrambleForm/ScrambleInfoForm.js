import React from 'react';
import {
  Form, Grid,
} from 'semantic-ui-react';

import useNestedInputUpdater from '../../../lib/hooks/useNestedInputUpdater';

function ScrambleInfoForm({
  state, setState,
}) {
  const {
    groupId, isExtra, scrambleNum, scrambleStr,
  } = state;

  const setGroupId = useNestedInputUpdater(setState, 'groupId');
  const setIsExtra = useNestedInputUpdater(setState, 'isExtra', 'checked');
  const setScrambleNum = useNestedInputUpdater(setState, 'scrambleNum');
  const setScrambleStr = useNestedInputUpdater(setState, 'scrambleStr');

  // FIXME: we use padded grid here because Bootstrap's row conflicts with
  // FUI's row and messes up the negative margins... :(
  return (
    <Form>
      <Grid stackable padded verticalAlign="bottom" columns={3}>
        <Grid.Column>
          <Form.Input
            label="Group ID"
            value={groupId}
            onChange={setGroupId}
          />
        </Grid.Column>
        <Grid.Column textAlign="center">
          <Form.Checkbox
            label="Is Extra?"
            checked={isExtra}
            onChange={setIsExtra}
          />
        </Grid.Column>
        <Grid.Column>
          <Form.Input
            label="Scramble #"
            value={scrambleNum}
            onChange={setScrambleNum}
            type="number"
            min={1}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Form.TextArea
            label="Scramble"
            value={scrambleStr}
            onChange={setScrambleStr}
          />
        </Grid.Column>
      </Grid>
    </Form>
  );
}

export default ScrambleInfoForm;
