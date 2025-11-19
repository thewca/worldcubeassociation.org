import { components } from "@/types/openapi";

export const rankingCellColour = (
  result: components["schemas"]["LiveResult"],
) => {
  if (result?.advancing) {
    return "advancing";
  }

  if (result?.advancing_questionable) {
    return "advancingQuestionable";
  }

  return "";
};
