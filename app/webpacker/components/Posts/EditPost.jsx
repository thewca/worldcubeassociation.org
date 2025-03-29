import React from 'react';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import PostForm from './PostForm';
import ConfirmProvider from '../../lib/providers/ConfirmProvider';

export default function Wrapper({
  allTags, post,
}) {
  return (
    <WCAQueryClientProvider>
      <ConfirmProvider>
        <PostForm post={post} allTags={allTags} header="Edit Post" />
      </ConfirmProvider>
    </WCAQueryClientProvider>
  );
}
