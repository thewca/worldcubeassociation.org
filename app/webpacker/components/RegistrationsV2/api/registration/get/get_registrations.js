import {
  getPsychSheetForEventUrl,
} from '../../../../../lib/requests/routes.js.erb';
import fetchWithJWTToken from '../../../../../lib/requests/fetchWithJWTToken';
import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { registrationRoutes } from '../../routes';

export async function getConfirmedRegistrations(
  competition,
) {
  const route = registrationRoutes[competition.registration_version]
    .confirmedRegistrationsUrl(competition.id);
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

export async function getAllRegistrations(
  competition,
) {
  const route = registrationRoutes[competition.registration_version]
    .allRegistrationsUrl(competition.id);
  const { data } = await fetchWithJWTToken(route);

  return data;
}

export async function getSingleRegistration(
  userId,
  competition,
) {
  const route = registrationRoutes[competition.registration_version]
    .singleRegistrationUrl(competition.id, userId);
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
