import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function runValidatorsForCompetitionsInRange(
  competitionRange,
  selectedValidators,
  applyFixWhenPossible,
) {
  const { data } = await fetchJsonOrError(actionUrls.validators.forCompetitionsInRange(
    JSON.stringify(competitionRange),
    selectedValidators,
    applyFixWhenPossible,
  ));
  return data;
}
