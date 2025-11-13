import { components } from "@/types/openapi";

const advancingColor = "0, 230, 118";

export const rankingCellStyle = (
  result: components["schemas"]["LiveResult"],
) => {
  if (result?.advancing) {
    return { backgroundColor: `rgb(${advancingColor})` };
  }

  if (result?.advancing_questionable) {
    return { backgroundColor: `rgba(${advancingColor}, 0.5)` };
  }

  return {};
};
