import { useQuery } from '@tanstack/react-query';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import {
  competitionAnnouncementDataUrl,
  competitionConfirmationDataUrl,
  competitionUserPreferencesUrl,
} from '../../lib/requests/routes.js.erb';

export function announcementDataQueryKey(competitionId) {
  return ['announcement-data', competitionId];
}

export function useAnnouncementData(competitionId) {
  return useQuery({
    queryKey: announcementDataQueryKey(competitionId),
    queryFn: () => fetchJsonOrError(competitionAnnouncementDataUrl(competitionId)),
  });
}

export function confirmationDataQueryKey(competitionId) {
  return ['confirmation-data', competitionId];
}

export function useConfirmationData(competitionId) {
  return useQuery({
    queryKey: confirmationDataQueryKey(competitionId),
    queryFn: () => fetchJsonOrError(competitionConfirmationDataUrl(competitionId)),
  });
}

export function userPreferencesQueryKey(competitionId) {
  return ['user-preferences', competitionId];
}

export function useUserPreferences(competitionId) {
  return useQuery({
    queryKey: userPreferencesQueryKey(competitionId),
    queryFn: () => fetchJsonOrError(competitionUserPreferencesUrl(competitionId)),
  });
}
