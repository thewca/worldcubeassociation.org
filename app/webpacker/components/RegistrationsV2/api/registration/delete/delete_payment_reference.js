import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { addPaymentReferenceUrl } from '../../../../../lib/requests/routes.js.erb';

export default function deletePaymentReference({ competitionId, userId }) {
  fetchWithJWTToken(
    addPaymentReferenceUrl(competitionId, userId),
    {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
    },
  );
}
