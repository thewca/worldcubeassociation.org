import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function runValidatorsForCompetitionsInRange(
  competitionRange,
  selectedValidators,
  applyFixWhenPossible,
) {
  const { data } = await fetchJsonOrError(actionUrls.validators.forCompetitionsInRange(
    competitionRange?.startDate,
    competitionRange?.endDate,
    selectedValidators,
    applyFixWhenPossible,
  ));
  return data;
}
