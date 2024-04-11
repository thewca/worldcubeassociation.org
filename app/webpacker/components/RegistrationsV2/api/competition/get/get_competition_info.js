import externalServiceFetch from '../../helper/external_service_fetch';
import { apiV0Urls } from '../../../../../lib/requests/routes.js.erb';

export default async function getCompetitionInfo(
  competitionId,
) {
  return externalServiceFetch(apiV0Urls.competitions.info(competitionId));
}
