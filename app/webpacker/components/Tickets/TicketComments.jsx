import React, { useState } from 'react';
import {
  Button,
  Comment,
  CommentAuthor,
  CommentAvatar,
  CommentContent,
  CommentGroup,
  CommentMetadata,
  CommentText,
  Header,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import TicketCommentCreate from './TicketCommentCreate';
import getComments from './api/getComments';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import '../../stylesheets/semantic/components/comment.min.css';

export default function TicketComments({ ticketId, currentStakeholder }) {
  const [createComment, setCreateComment] = useState(false);

  const {
    data: comments, isLoading, isError, refetch, isRefetching,
  } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: () => getComments({ ticketId }),
  });

  if (isLoading || isRefetching) {
    return <Loading />;
  }
  if (isError) {
    return <Errored />;
  }

  return (
    <>
      <Header as="h2">Comments</Header>
      <Button onClick={() => setCreateComment(true)}>Add new comment</Button>

      <CommentGroup>
        {comments.map((comment) => (
          <Comment>
            <CommentAvatar src={comment.acting_user.avatar.thumb_url} />
            <CommentContent>
              <CommentAuthor as="a">{comment.acting_user.name}</CommentAuthor>
              <CommentMetadata>
                <div>{DateTime.fromISO(comment.created_at).toLocal().toRelative()}</div>
              </CommentMetadata>
              <CommentText>{comment.comment}</CommentText>
            </CommentContent>
          </Comment>
        ))}
      </CommentGroup>

      <TicketCommentCreate
        open={createComment}
        onClose={() => setCreateComment(false)}
        ticketId={ticketId}
        currentStakeholder={currentStakeholder}
        refetchComments={refetch}
      />
    </>
  );
}
