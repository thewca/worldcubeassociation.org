import createClient from 'openapi-fetch';
import getJWT from '../../auth/get_jwt';
import { BackendError, EXPIRED_TOKEN } from '../../helper/error_codes';
import { wcaRegistrationUrl } from '../../../../../lib/requests/routes.js.erb';

const { GET } = createClient({
  baseUrl: wcaRegistrationUrl,
});

export async function getConfirmedRegistrations(
  competitionID,
) {
  const { data, response } = await GET(
    '/api/v1/registrations/{competition_id}',
    {
      params: { path: { competition_id: competitionID } },
    },
  );
  if (!response.ok) {
    throw new BackendError(500, response.status);
  }
  return data;
}

export async function getPsychSheetForEvent(
  competitionId,
  eventId,
  sortBy,
) {
  const { data, response } = await GET(
    '/api/v1/psych_sheet/{competition_id}/{event_id}',
    {
      params: {
        path: { competition_id: competitionId, event_id: eventId },
        query: { sort_by: sortBy },
      },
    },
  );
  if (!response.ok) {
    throw new BackendError(500, response.status);
  }
  return data;
}

export async function getAllRegistrations(
  competitionID,
) {
  const { data, error, response } = await GET(
    '/api/v1/registrations/{competition_id}/admin',
    {
      params: { path: { competition_id: competitionID } },
      headers: { Authorization: await getJWT() },
    },
  );
  if (error) {
    if (error.error === EXPIRED_TOKEN) {
      await getJWT(true);
      return getAllRegistrations(competitionID);
    }
    throw new BackendError(error.error, response.status);
  }

  return data;
}

export async function getSingleRegistration(
  userId,
  competitionId,
) {
  const { data, error, response } = await GET('/api/v1/register', {
    params: { query: { competition_id: competitionId, user_id: userId } },
    headers: { Authorization: await getJWT() },
  });
  if (error) {
    if (error.error === EXPIRED_TOKEN) {
      await getJWT(true);
      return getSingleRegistration(userId, competitionId);
    }
    // 404 means that the registration doesn't exist
    if (response.status === 404) {
      return null;
    }
    throw new BackendError(error.error, response.status);
  }

  return data;
}

export async function getWaitingCompetitors(
  competitionId,
) {
  const { data, error, response } = await GET(
    '/api/v1/registrations/{competition_id}/waiting',
    {
      params: { path: { competition_id: competitionId } },
      headers: { Authorization: await getJWT() },
    },
  );
  if (error) {
    if (error.error === EXPIRED_TOKEN) {
      await getJWT(true);
      return getWaitingCompetitors(competitionId);
    }
    throw new BackendError(error.error, response.status);
  }

  return data;
}
