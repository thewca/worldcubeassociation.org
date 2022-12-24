import { LegacyGoogleProvider } from 'leaflet-geosearch';
import { fetchWithAuthenticityToken } from '../requests/fetchWithAuthenticityToken';
import { geocodingApiUrl } from '../requests/routes.js.erb';

export default class WCAProvider extends LegacyGoogleProvider {
  endpoint({ query } = {}) {
    const paramString = this.getParamString({
      q: query,
    });
    return `${geocodingApiUrl}?${paramString}`;
  }

  // This overrides Provider's search method, to be able to include the CSRF token.
  async search({ query }) {
    const url = this.endpoint({ query });
    const request = await fetchWithAuthenticityToken(url);
    const json = await request.json();
    return this.parse({ data: json });
  }
}
