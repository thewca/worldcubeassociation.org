import { LiveAttempt } from "@/types/live";

export const padSkipped = (
  attempts: LiveAttempt[],
  expectedNumberOfAttempts: number,
): LiveAttempt[] => {
  return [
    ...attempts,
    ...Array(expectedNumberOfAttempts - attempts.length).fill({ value: 0 }),
  ];
};
