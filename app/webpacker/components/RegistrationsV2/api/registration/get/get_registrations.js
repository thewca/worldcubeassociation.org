import {
  getPsychSheetForEventUrl, confirmedRegistrationsUrl, allRegistrationsUrl, singleRegistrationUrl,
} from '../../../../../lib/requests/routes.js.erb';
import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';

export async function getConfirmedRegistrations(
  competitionID,
) {
  const { data } = await fetchJsonOrError(confirmedRegistrationsUrl(competitionID));
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
