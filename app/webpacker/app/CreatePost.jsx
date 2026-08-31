import React from 'react';
import WCAQueryClientProvider from '../lib/providers/WCAQueryClientProvider';
import PostForm from '../components/Posts/PostForm';

export default function Wrapper({
  allTags,
}) {
  return (
    <WCAQueryClientProvider>
      <PostForm allTags={allTags} header="New Post" />
    </WCAQueryClientProvider>
  );
}
