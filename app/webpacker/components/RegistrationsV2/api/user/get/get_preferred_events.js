import externalServiceFetch from '../../helper/external_service_fetch';
import { apiV0Urls } from '../../../../../lib/requests/routes.js.erb';

export default async function getPreferredEvents() {
  return externalServiceFetch(apiV0Urls.users.me.preferred_events);
}
