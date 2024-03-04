import { fetchWithAuthenticityToken } from './requests/fetchWithAuthenticityToken';

document.addEventListener('cookies-eu-acknowledged', async () => {
  const response = await fetchWithAuthenticityToken('/profile/acknowledge-cookies', { method: 'POST' });
  const json = await response.json();

  if (response.status === 401) {
    console.warn("Attempt to record cookies acknowledged in the database failed because you're not logged in.");
    return;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}\n${json.error}`);
  }
});
