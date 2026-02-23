import { components } from "@/types/openapi";

export const padSkipped = (
  attempts: components["schemas"]["LiveAttempt"][],
  expectedNumberOfAttempts: number,
): components["schemas"]["LiveAttempt"][] => {
  return [
    ...attempts,
    ...Array(expectedNumberOfAttempts - attempts.length).fill({ value: 0 }),
  ];
};
