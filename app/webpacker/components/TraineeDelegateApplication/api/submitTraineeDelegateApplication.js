import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { traineeDelegateApplicationUrl } from '../../../lib/requests/routes.js.erb';

export default async function submitTraineeDelegateApplication(application) {
  const { data } = await fetchJsonOrError(traineeDelegateApplicationUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ trainee_delegate_application: application }),
  });
  return data;
}
