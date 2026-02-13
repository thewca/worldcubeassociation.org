import { components } from "@/types/openapi";

export const padSkipped = (
  attempts: components["schemas"]["LiveAttempt"][],
  expectedNumberOfAttempts: number,
) => {
  return [
    ...attempts,
    ...Array(expectedNumberOfAttempts - attempts.length).fill(0),
  ];
};
