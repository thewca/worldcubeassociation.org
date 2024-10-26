import {
  allRegistrationsUrl, bulkUpdateRegistrationUrl,
  confirmedRegistrationsUrl, paymentTicketUrl,
  singleRegistrationUrl, submitRegistrationUrl, updateRegistrationUrl,
  wcaRegistrationUrl,
} from '../../../lib/requests/routes.js.erb';

/* eslint-disable import/prefer-default-export */
export const registrationRoutes = {
  v2: {
    confirmedRegistrationsUrl: (competitionId) => `${wcaRegistrationUrl}/api/v1/registrations/${competitionId}`,
    allRegistrationsUrl: (competitionId) => `${wcaRegistrationUrl}/api/v1/registrations/${competitionId}/admin`,
    singleRegistrationUrl: (competitionId, userId) => `${wcaRegistrationUrl}/api/v1/register?user_id=${userId}&competition_id=${competitionId}`,
    updateRegistrationUrl: `${wcaRegistrationUrl}/api/v1/register`,
    bulkUpdateRegistrationUrl: `${wcaRegistrationUrl}/api/v1/bulk_update`,
    submitRegistrationUrl: `${wcaRegistrationUrl}/api/v1/register`,
    paymentTicketUrl: (competitionId, donationAmount) => `${wcaRegistrationUrl}/api/v1/${competitionId}/payment?donation_iso=${donationAmount}`,
  },
  v3: {
    confirmedRegistrationsUrl,
    allRegistrationsUrl,
    singleRegistrationUrl,
    submitRegistrationUrl,
    updateRegistrationUrl,
    bulkUpdateRegistrationUrl,
    paymentTicketUrl,
  },
};
