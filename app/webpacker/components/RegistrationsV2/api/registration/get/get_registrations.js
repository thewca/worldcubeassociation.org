import { wcaRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';
import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';

const confirmedRegistrationsUrl = (competitionId) => `${wcaRegistrationUrl}/api/v1/registrations/${competitionId}`;
const getPsychSheetForEventUrl = (competitionId, eventId, sortBy) => `${wcaRegistrationUrl}/api/v1/psych_sheet/${competitionId}/${eventId}?sort_by=${sortBy}`;
const allRegistrationsUrl = (competitionId) => `${wcaRegistrationUrl}/api/v1/registrations/${competitionId}/admin`;
const singleRegistrationUrl = (competitionId, userId) => `${wcaRegistrationUrl}/api/v1/register?user_id=${userId}&competition_id=${competitionId}`;
const waitingCompetitiorsUrl = (competitionId) => `${wcaRegistrationUrl}/api/v1/registrations/${competitionId}/waiting`;

export async function getConfirmedRegistrations(
  competitionID,
) {
  const { data } = await fetchWithJWTToken(confirmedRegistrationsUrl(competitionID));
  return data;
}

export async function getPsychSheetForEvent(
  competitionId,
  eventId,
  sortBy,
) {
  const { data } = await fetchJsonOrError(getPsychSheetForEventUrl(competitionId, eventId, sortBy));
  return data;
}

export async function getAllRegistrations(
  competitionID,
) {
  const { data } = await fetchWithJWTToken(allRegistrationsUrl(competitionID));

  return data;
}

export async function getSingleRegistration(
  userId,
  competitionId,
) {
  try {
    const { data } = await fetchWithJWTToken(singleRegistrationUrl(competitionId, userId));
    return data;
  } catch (e) {
    // 404 means that the registration doesn't exist
    if (e.response.status === 404) {
      return null;
    }
    throw e;
  }
}

export async function getWaitingCompetitors(
  competitionId,
) {
  const { data } = await fetchWithJWTToken(waitingCompetitiorsUrl(competitionId));

  return data;
}
