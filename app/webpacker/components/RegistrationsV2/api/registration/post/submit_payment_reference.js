import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { addPaymentReferenceUrl } from '../../../../../lib/requests/routes.js.erb';

export default function submitPaymentReference({ reference, competitionId, userId }) {
  fetchWithJWTToken(
    addPaymentReferenceUrl(competitionId, userId),
    {
      method: 'POST',
      body: JSON.stringify({ payment_reference: reference }),
      headers: { 'content-type': 'application/json' },
    },
  );
}
