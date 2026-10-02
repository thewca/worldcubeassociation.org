import { describe, expect, it } from "vitest";
import {
  initialStepIndex,
  isStepEditable,
  summarySteps,
} from "@/components/competitions/Registration/steps";
import type { components } from "@/types/openapi";

type StepConfig = components["schemas"]["RegistrationConfig"];
type Registration = components["schemas"]["RegistrationDataV2"];
type CompetingStatus = components["schemas"]["CompetingStatus"];

// The order the backend sends for a competition that takes payments.
const steps = [
  {
    key: "requirements",
    is_editable: false,
    is_post_step: false,
    summary_status: "hide",
  },
  {
    key: "competing",
    is_editable: true,
    is_post_step: false,
    summary_status: "show",
  },
  {
    key: "payment",
    is_editable: true,
    is_post_step: true,
    summary_status: "show",
  },
  {
    key: "approval",
    is_editable: false,
    is_post_step: true,
    summary_status: "priority",
  },
] as StepConfig[];

const START = 0;
const COMPLETE = steps.length;

const registrationWith = (
  registration_status: CompetingStatus,
  has_paid = true,
) =>
  ({
    competing: { event_ids: ["333"], registration_status },
    payment: { has_paid },
  }) as Registration;

describe("initialStepIndex", () => {
  it("starts at the beginning without a registration", () => {
    expect(initialStepIndex(steps, null)).toBe(START);
  });

  it("completes the flow for a registration found on page load, before anything was clicked", () => {
    expect(initialStepIndex(steps, registrationWith("pending"))).toBe(COMPLETE);
  });

  it("keeps the flow complete while a fee is outstanding, so the competitor can still act on their registration", () => {
    expect(initialStepIndex(steps, registrationWith("pending", false))).toBe(
      COMPLETE,
    );
  });

  it("hands a withdrawn competitor back to the beginning", () => {
    expect(initialStepIndex(steps, registrationWith("cancelled"))).toBe(START);
  });
});

describe("summarySteps", () => {
  it("puts post steps before pre steps, priority first within each, and leaves hidden steps out", () => {
    expect(summarySteps(steps).map((step) => step.key)).toEqual([
      "approval",
      "payment",
      "competing",
    ]);
  });

  it("does not let a priority pre step jump ahead of the post steps", () => {
    const stepsWithPriorityPreStep = [
      {
        key: "competing",
        is_editable: true,
        is_post_step: false,
        summary_status: "priority",
      },
      {
        key: "payment",
        is_editable: true,
        is_post_step: true,
        summary_status: "show",
      },
    ] as StepConfig[];

    expect(
      summarySteps(stepsWithPriorityPreStep).map((step) => step.key),
    ).toEqual(["payment", "competing"]);
  });
});

describe("isStepEditable", () => {
  const [requirements, competing] = steps;

  it("follows the server for steps without extra rules", () => {
    expect(isStepEditable(requirements, registrationWith("accepted"))).toBe(
      false,
    );
  });

  it("lets a pending competitor change what they signed up for", () => {
    expect(isStepEditable(competing, registrationWith("pending"))).toBe(true);
  });

  it("does not let a rejected competitor change what they signed up for", () => {
    expect(isStepEditable(competing, registrationWith("rejected"))).toBe(false);
  });
});
