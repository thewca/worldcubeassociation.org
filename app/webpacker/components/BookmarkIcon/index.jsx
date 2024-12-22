import React, { useState } from 'react';
import { Icon, Popup } from 'semantic-ui-react';
import { useMutation } from '@tanstack/react-query';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import { bookmarkCompetition, unbookmarkCompetition } from './api/bookmarkCompetition';
import I18n from '../../lib/i18n';

export default function Wrapper({ competitionIsBookmarked, competitionId }) {
  return (
    <WCAQueryClientProvider>
      <BookmarkIcon
        competitionInitiallyBookmarked={competitionIsBookmarked}
        competitionId={competitionId}
      />
    </WCAQueryClientProvider>
  );
}

function BookmarkIcon({ competitionInitiallyBookmarked, competitionId }) {
  const [isBookmarked, setIsBookmarked] = useState(competitionInitiallyBookmarked);

  const { mutate: bookmarkCompetitionMutation, isPending: isBookmarking } = useMutation({
    mutationFn: bookmarkCompetition,
    onSuccess: () => {
      setIsBookmarked(true);
    },
  });

  const { mutate: unbookmarkCompetitionMutation, isPending: isUnbookmarking } = useMutation({
    mutationFn: unbookmarkCompetition,
    onSuccess: () => {
      setIsBookmarked(false);
    },
  });

  return (
    <Popup
      trigger={(
        <Icon
          disabled={isBookmarking || isUnbookmarking}
          link
          onClick={() => (isBookmarked ? unbookmarkCompetitionMutation(competitionId) : bookmarkCompetitionMutation(competitionId))}
          name={isBookmarking || isUnbookmarking ? 'spinner' : 'bookmark'}
          color={isBookmarked ? 'black' : 'grey'}
        />
    )}
      content={isBookmarked ? I18n.t('competitions.competition_info.is_bookmarked') : I18n.t('competitions.competition_info.bookmark')}
    />
  );
}
