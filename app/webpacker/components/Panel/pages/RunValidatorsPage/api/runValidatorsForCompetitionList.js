import { fetchJsonOrError } from '../../../../../lib/requests/fetchWithAuthenticityToken';
import { actionUrls } from '../../../../../lib/requests/routes.js.erb';

export default async function runValidatorsForCompetitionList(
  competitionIds,
  selectedValidators,
  applyFixWhenPossible,
) {
  const { data } = await fetchJsonOrError(actionUrls.validators.forCompetitionList(
    competitionIds,
    selectedValidators,
    applyFixWhenPossible,
  ));
  return data;
}
