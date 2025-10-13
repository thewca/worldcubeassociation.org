import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { postUrl, submitPostUrl } from '../../../lib/requests/routes.js.erb';

export const createPost = (post) => fetchJsonOrError(submitPostUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ post }),
});

export const editPost = (post) => fetchJsonOrError(postUrl(post.id), {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ post }),
});
