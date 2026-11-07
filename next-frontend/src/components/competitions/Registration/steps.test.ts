import { describe, expect, it } from "vitest";
import {
  initialStepIndex,
  isStepComplete,
  isStepEditable,
  summarySteps,
} from "@/components/competitions/Registration/steps";
import type { RegistrationFormValues } from "@/lib/wca/registrations/registrationForm";
import type { components } from "@/types/openapi";

type StepConfig = components["schemas"]["RegistrationConfig"];
type Registration = components["schemas"]["RegistrationDataV2"];
type CompetingStatus = components["schemas"]["CompetingStatus"];
type CompetingStepConfig = components["schemas"]["CompetingStepConfig"];

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

describe("isStepComplete", () => {
  const competingStep = (parameters: Record<string, unknown>) =>
    ({
      key: "competing",
      is_editable: true,
      is_post_step: false,
      summary_status: "show",
      parameters: {
        guest_entry_status: "free",
        force_comment_in_registration: false,
        ...parameters,
      },
    }) as CompetingStepConfig;

  const valuesWith = (values: Partial<RegistrationFormValues>) => ({
    comment: "",
    guests: 0,
    eventIds: ["333"],
    hasAcknowledgedRequirements: false,
    ...values,
  });

  const [requirements, , payment, approval] = steps;

  it("waits for the competitor to acknowledge the requirements", () => {
    expect(isStepComplete(requirements, valuesWith({}))).toBe(false);
    expect(
      isStepComplete(
        requirements,
        valuesWith({ hasAcknowledgedRequirements: true }),
      ),
    ).toBe(true);
  });

  it("needs at least one event", () => {
    expect(
      isStepComplete(competingStep({}), valuesWith({ eventIds: [] })),
    ).toBe(false);
    expect(isStepComplete(competingStep({}), valuesWith({}))).toBe(true);
  });

  it("does not accept more events than the competition allows", () => {
    const step = competingStep({ events_per_registration_limit: 2 });

    expect(isStepComplete(step, valuesWith({ eventIds: ["333", "222"] }))).toBe(
      true,
    );
    expect(
      isStepComplete(step, valuesWith({ eventIds: ["333", "222", "444"] })),
    ).toBe(false);
  });

  it("does not accept more guests than the competition allows", () => {
    const step = competingStep({
      guest_entry_status: "restricted",
      guests_per_registration_limit: 2,
    });

    expect(isStepComplete(step, valuesWith({ guests: 2 }))).toBe(true);
    expect(isStepComplete(step, valuesWith({ guests: 3 }))).toBe(false);
  });

  it("needs a comment when the competition forces one", () => {
    const step = competingStep({ force_comment_in_registration: true });

    expect(isStepComplete(step, valuesWith({ comment: "  " }))).toBe(false);
    expect(isStepComplete(step, valuesWith({ comment: "Hi" }))).toBe(true);
  });

  it("has nothing to ask for in the steps after submitting", () => {
    expect(isStepComplete(payment, valuesWith({}))).toBe(true);
    expect(isStepComplete(approval, valuesWith({}))).toBe(true);
  });
});
