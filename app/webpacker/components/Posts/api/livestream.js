import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { updateTestVideoIdUrl, promoteTestVideoIdUrl } from '../../../lib/requests/routes.js.erb';

export async function updateTestVideoId(value) {
  const { data } = await fetchJsonOrError(updateTestVideoIdUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ new_test_value: value }),
  });
  return data;
}

export async function promoteTestVideoId() {
  const { data } = await fetchJsonOrError(promoteTestVideoIdUrl, {
    method: 'PATCH',
  });
  return data;
}
