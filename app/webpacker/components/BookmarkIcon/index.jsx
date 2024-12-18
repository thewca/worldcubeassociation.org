import React, { useState } from 'react';
import { Icon } from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import { bookmarkCompetition, unbookmarkCompetition } from './api/bookmarkCompetition';

export default function Wrapper({ competitionIsBookmarked, competitionId }) {
  return (
    <WCAQueryClientProvider>
      <BookmarkIcon competitionInitiallyBookmarked={competitionIsBookmarked} competitionId={competitionId} />
    </WCAQueryClientProvider>
  );
}

function BookmarkIcon({ competitionInitiallyBookmarked, competitionId }) {
  const [isBookmarked, setIsBookmarked] = useState(competitionInitiallyBookmarked);

  const { mutate: bookmarkCompetitionMutation, isPending: isBookmarking } = useMutation({
    mutationFn: bookmarkCompetition,
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
    },
  });

  const { mutate: unbookmarkCompetitionMutation, isPending: isUnbookmarking } = useMutation({
    mutationFn: unbookmarkCompetition,
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
    },
  });

  return (
    <Icon
      link
      onClick={() => (isBookmarked ? unbookmarkCompetitionMutation(competitionId) : bookmarkCompetitionMutation(competitionId))}
      name={isBookmarking || isUnbookmarking ? 'spinner' : 'bookmark'}
      color={isBookmarked ? 'black' : 'grey'}
    />
  );
}
