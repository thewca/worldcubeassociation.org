import { LiveAttempt } from "@/types/live";

export const padSkipped = (
  attempts: LiveAttempt[],
  expectedNumberOfAttempts: number,
): LiveAttempt[] => {
  const byNumber = new Map(attempts.map((a) => [a.attempt_number, a]));
  return Array.from({ length: expectedNumberOfAttempts }, (_, i) => {
    const attemptNumber = i + 1;
    return (
      byNumber.get(attemptNumber) ?? { value: 0, attempt_number: attemptNumber }
    );
  });
};
