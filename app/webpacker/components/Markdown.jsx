import React from 'react';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import Loading from './Requests/Loading';
import renderMarkdownFetch from '../lib/utils/markdown';

/*
  @md: The markdown text as plain text
  @id: Set an ID if you want to cache the results of rendering the markdown
 */
export default function Markdown({ md, id = crypto.randomUUID() }) {
  const {
    data: html,
    isLoading,
  } = useQuery({
    queryKey: ['markdown', id],
    queryFn: () => renderMarkdownFetch(md),
    staleTime: Infinity,
  });

  return isLoading ? <Loading /> : (
    // eslint-disable-next-line react/no-danger
    <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
  );
}
