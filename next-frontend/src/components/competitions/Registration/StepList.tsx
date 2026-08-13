"use client";

import { Box, Circle, HStack, Icon, Stack, Text } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import { Fragment } from "react";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";

type StepConfig = components["schemas"]["RegistrationConfig"];
type StepKey = StepConfig["key"];

// Mirrors the `steps` slot recipe, whose values we cannot inherit because this list is
//   hand-rolled rather than built from `Steps.List`.
const INDICATOR_SIZE = "10";
const INDICATOR_ICON_SIZE = "4";
const INDICATOR_THICKNESS = "2px";

/**
 * Chakra's `Steps` derives "complete" from position alone - `index < step` - so a step the
 * competitor has already finished renders as unfinished the moment they navigate back to an
 * earlier one. An accepted registration has to keep reading as approved even while its owner is
 * editing their events, so completion here comes from the registration itself instead.
 */
export default function StepList({
  steps,
  activeStep,
  isStepComplete,
  isStepDisabled,
  onStepSelect,
}: {
  steps: StepConfig[];
  activeStep: number;
  isStepComplete: Record<StepKey, boolean>;
  isStepDisabled: (step: StepConfig, index: number) => boolean;
  onStepSelect: (index: number) => void;
}) {
  const { t } = useT();

  return (
    // Four labelled steps do not fit side by side on a phone. Rather than drop the labels - which
    //   would leave a row of anonymous circles saying nothing once they are all ticked - the strip
    //   turns into one step per row, the same thing the Semantic UI panel does with
    //   `stackable="tablet"`.
    <Stack
      width="full"
      colorPalette="blue"
      direction={{ base: "column", lg: "row" }}
      align={{ base: "stretch", lg: "center" }}
      gap={{ base: "4", lg: "0" }}
    >
      {steps.map((step, index) => {
        const translationKey = `competitions.registration_v2.register.panel.${step.key}`;
        const isComplete = isStepComplete[step.key];
        const isCurrent = index === activeStep;

        return (
          <Fragment key={step.key}>
            <HStack
              gap="3"
              cursor="pointer"
              _disabled={{ cursor: "default" }}
              asChild
            >
              <button
                type="button"
                disabled={isStepDisabled(step, index)}
                onClick={() => onStepSelect(index)}
              >
                <Circle
                  size={INDICATOR_SIZE}
                  flexShrink="0"
                  fontWeight="medium"
                  borderWidth={INDICATOR_THICKNESS}
                  borderColor={
                    isComplete || isCurrent ? "colorPalette.solid" : "border"
                  }
                  bg={
                    isComplete
                      ? "colorPalette.solid"
                      : isCurrent
                        ? "colorPalette.muted"
                        : undefined
                  }
                  color={
                    isComplete ? "colorPalette.contrast" : "colorPalette.fg"
                  }
                >
                  {isComplete ? (
                    <Icon boxSize={INDICATOR_ICON_SIZE}>
                      <LuCheck />
                    </Icon>
                  ) : (
                    index + 1
                  )}
                </Circle>
                {/* `minW` lets a long label shrink rather than push the row wider than the
                      viewport once the steps sit side by side. */}
                <Stack gap="0" textAlign="start" minW="0">
                  <Text textStyle="sm" fontWeight="medium" color="fg">
                    {t(`${translationKey}.title`)}
                  </Text>
                  <Text textStyle="sm" color="fg.muted">
                    {t(`${translationKey}.description`)}
                  </Text>
                </Stack>
              </button>
            </HStack>

            {index < steps.length - 1 && (
              // The bar leading out of a step is filled once that step itself is done, so the
              //   strip reads as complete up to wherever the registration actually is. It only
              //   connects anything while the steps are in a row.
              <Box
                hideBelow="lg"
                flex="1"
                marginX="3"
                height={INDICATOR_THICKNESS}
                bg={isComplete ? "colorPalette.solid" : "border"}
              />
            )}
          </Fragment>
        );
      })}
    </Stack>
  );
}
