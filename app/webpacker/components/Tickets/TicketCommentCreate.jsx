import React from 'react';
import { Button, Modal } from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import MarkdownEditor from '../wca/FormBuilder/input/MarkdownEditor';
import useInputState from '../../lib/hooks/useInputState';
import createComment from './api/createComment';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';

export default function TicketCommentCreate({
  open, onClose, ticketId, currentStakeholder, refetchComments,
}) {
  const [comment, setComment] = useInputState();

  const {
    mutate: doCreateComment,
    isPending,
    isError,
  } = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      setComment('');
      refetchComments();
      onClose();
    },
  });

  if (isPending) return <Loading />;
  if (isError) return <Errored />;

  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <Modal.Header>Add new comment</Modal.Header>
      <Modal.Content>
        <MarkdownEditor
          id="new-comment"
          value={comment}
          onChange={setComment}
        />
      </Modal.Content>
      <Modal.Actions>
        <Button
          primary
          onClick={() => doCreateComment({ ticketId, comment, currentStakeholder })}
        >
          Add comment
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
