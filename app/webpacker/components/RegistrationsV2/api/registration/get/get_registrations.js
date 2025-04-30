import {
  allRegistrationsUrl, confirmedRegistrationsUrl,
  getPsychSheetForEventUrl, registrationHistoryUrl, singleRegistrationUrl,
} from '../../../../../lib/requests/routes.js.erb';
import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';

export async function getConfirmedRegistrations(competition) {
  const route = confirmedRegistrationsUrl(competition.id);
  const { data } = await fetchJsonOrError(route);
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

export async function getAllRegistrations(competition) {
  const route = allRegistrationsUrl(competition.id);
  const { data } = await fetchWithJWTToken(route);

  return data;
}

export async function getSingleRegistration(
  userId,
  competition,
) {
  const route = singleRegistrationUrl(competition.id, userId);
  try {
    const { data } = await fetchWithJWTToken(route);
    return data;
  } catch (e) {
    // 404 means that the registration doesn't exist
    if (e.response.status === 404) {
      return null;
    }
    throw e;
  }
}

export async function getRegistrationHistory(
  registrationId,
) {
  const { data } = await fetchJsonOrError(registrationHistoryUrl(registrationId));
  return data;
}
