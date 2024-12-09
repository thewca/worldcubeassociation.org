import React from 'react';
import WCAQueryClientProvider from '../../lib/providers/WCAQueryClientProvider';
import PostForm from './PostForm';

export default function Wrapper({
  allTags, post,
}) {
  return (
    <WCAQueryClientProvider>
      <PostForm post={post} allTags={allTags} header="New Post" />
    </WCAQueryClientProvider>
  );
}
