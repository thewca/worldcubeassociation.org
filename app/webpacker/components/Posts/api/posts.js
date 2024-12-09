import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { postUrl, submitPostUrl } from '../../../lib/requests/routes.js.erb';

export const createOrEditPost = (post) => {
  const url = post.id ? postUrl(post.id) : submitPostUrl;
  const method = post.id ? 'PATCH' : 'POST';
  return fetchJsonOrError(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ post }),
  });
};
