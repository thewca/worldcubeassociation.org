import { LiveAttempt } from "@/types/live";

export const padSkipped = (
  attempts: LiveAttempt[],
  expectedNumberOfAttempts: number,
): LiveAttempt[] => {
  return [
    ...attempts,
    ...Array.from(
      { length: expectedNumberOfAttempts - attempts.length },
      (_, i) => ({
        value: 0,
        attempt_number: attempts.length + i + 1,
      }),
    ),
  ];
};
