import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function runValidatorsForCompetitionList(
  competitionIds,
  selectedValidators,
  applyFixWhenPossible = false,
  checkRealResults = true,
) {
  const { data } = await fetchJsonOrError(actionUrls.validators.forCompetitionList(
    competitionIds,
    selectedValidators,
    applyFixWhenPossible,
    checkRealResults,
  ));
  return data;
}
