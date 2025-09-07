import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { captureManualPaymentsUrl } from '../../../../../lib/requests/routes.js.erb';

export async function captureManualPayments(competitionId, registrationIds) {
  const route = captureManualPaymentsUrl(competitionId);
  const { data } = await fetchWithJWTToken(route, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: { registration_ids: registrationIds }
  });
  return data;
}
