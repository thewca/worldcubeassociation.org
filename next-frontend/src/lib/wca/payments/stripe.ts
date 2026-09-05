/**
 * Where Stripe sends the competitor once they have confirmed the payment.
 *
 * This has to be the monolith rather than a page of ours: `RegistrationsController#payment_completion`
 * is what retrieves the intent from Stripe and writes the payment to our database. Pointing Stripe
 * anywhere else would take the money without recording it.
 */
export function paymentCompletionUrl(competitionId: string) {
  // The API base is the only handle we have on the monolith's origin, and using it keeps
  //   development payments pointed at the development monolith rather than at production.
  const apiBase = process.env.NEXT_PUBLIC_WCA_FRONTEND_API_URL;

  // Leading slash on purpose: the completion route sits at the monolith's root, not under `/api`.
  return new URL(
    `/competitions/${competitionId}/payment-completion/stripe`,
    apiBase,
  ).toString();
}
