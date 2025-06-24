import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { livestreamLinksUrl, updateTestLinkUrl, promoteTestLinkUrl } from '../../../lib/requests/routes.js.erb';

export async function getLivestreamLinks() {
  fetchJsonOrError(livestreamLinksUrl, {
    method: 'GET',
  });
}

export async function updateTestLink(value) {
  const { data } = await fetchJsonOrError(updateTestLinkUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ new_test_value: value }),
  });
  return data;
}

export async function promoteTestLink() {
  const { data } = await fetchJsonOrError(promoteTestLinkUrl, {
    method: 'GET',
  });
  return data;
}
