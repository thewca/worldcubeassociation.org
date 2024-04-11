import externalServiceFetch from '../../helper/external_service_fetch';
import { apiV0Urls } from '../../../../../lib/requests/routes.js.erb';

export default async function getMe() {
  const userRequest = await externalServiceFetch(apiV0Urls.users.me.info);
  return userRequest.user;
}
