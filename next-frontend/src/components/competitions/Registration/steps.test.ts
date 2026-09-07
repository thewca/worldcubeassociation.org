import { describe, expect, it } from "vitest";
import {
  activeStepIndex,
  isGatingStep,
  type StepContext,
} from "@/components/competitions/Registration/steps";
import type { components } from "@/types/openapi";

type StepConfig = components["schemas"]["RegistrationConfig"];

// The order the backend sends for a competition that takes payments.
const steps = [
  { key: "requirements" },
  { key: "competing" },
  { key: "payment" },
  { key: "approval" },
] as StepConfig[];

const REQUIREMENTS = 0;
const COMPETING = 1;
const COMPLETE = steps.length;

const contextWith = (overrides: Partial<StepContext>) =>
  ({
    hasRegistration: false,
    hasAcknowledgedRequirements: false,
    hasAcceptedRequirements: false,
    isPaymentOutstanding: false,
    ...overrides,
  }) as StepContext;

describe("isGatingStep", () => {
  it("separates the steps the competitor works through from the ones they watch", () => {
    expect(steps.filter(isGatingStep).map((step) => step.key)).toEqual([
      "requirements",
      "competing",
    ]);
  });
});

describe("activeStepIndex", () => {
  it("starts on the requirements", () => {
    expect(activeStepIndex(steps, contextWith({}))).toBe(REQUIREMENTS);
  });

  it("stays on the requirements until they are accepted, not merely ticked", () => {
    expect(
      activeStepIndex(
        steps,
        contextWith({ hasAcknowledgedRequirements: true }),
      ),
    ).toBe(REQUIREMENTS);
  });

  it("moves to the registration form once the requirements are accepted", () => {
    expect(
      activeStepIndex(steps, contextWith({ hasAcceptedRequirements: true })),
    ).toBe(COMPETING);
  });

  it("completes the flow once a registration stands", () => {
    expect(
      activeStepIndex(
        steps,
        contextWith({ hasAcceptedRequirements: true, hasRegistration: true }),
      ),
    ).toBe(COMPLETE);
  });

  it("completes the flow for a registration found on page load, before anything was clicked", () => {
    expect(activeStepIndex(steps, contextWith({ hasRegistration: true }))).toBe(
      COMPLETE,
    );
  });

  it("keeps the flow complete while a fee is outstanding, so the competitor can still act on their registration", () => {
    expect(
      activeStepIndex(
        steps,
        contextWith({ hasRegistration: true, isPaymentOutstanding: true }),
      ),
    ).toBe(COMPLETE);
  });

  it("hands a withdrawn competitor back to the requirements", () => {
    expect(
      activeStepIndex(
        steps,
        // Withdrawing clears the acceptance, and the registration no longer stands.
        contextWith({ hasAcknowledgedRequirements: true }),
      ),
    ).toBe(REQUIREMENTS);
  });

  it("takes the order of the steps from the server rather than from their names", () => {
    const reordered = [
      { key: "competing" },
      { key: "requirements" },
    ] as StepConfig[];

    expect(activeStepIndex(reordered, contextWith({}))).toBe(0);
    expect(
      activeStepIndex(reordered, contextWith({ hasRegistration: true })),
    ).toBe(reordered.length);
  });

  it("completes a lane whose steps are all watched rather than worked through", () => {
    const watchedOnly = [{ key: "approval" }] as StepConfig[];

    expect(activeStepIndex(watchedOnly, contextWith({}))).toBe(
      watchedOnly.length,
    );
  });
});
