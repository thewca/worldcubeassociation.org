import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { paymentCaptureToggleUrl } from '../../../../../lib/requests/routes.js.erb';

export async function togglePaymentCapture(registrationPaymentId) {
  const route = paymentCaptureToggleUrl(registrationPaymentId);
  const { data } = await fetchWithJWTToken(route, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return data;
}
