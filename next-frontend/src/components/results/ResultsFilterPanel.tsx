import type { ReactNode } from "react";
import {
  Box,
  Circle,
  Collapsible,
  Float,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { LuFilter } from "react-icons/lu";
import { useT } from "@/lib/i18n/useI18n";

type ResultsFilterPanelProps = {
  tabs: ReactNode;
  hasActiveFilters: boolean;
  children: ReactNode;
};

export default function ResultsFilterPanel({
  tabs,
  hasActiveFilters,
  children,
}: ResultsFilterPanelProps) {
  const { t } = useT();

  return (
    <Collapsible.Root width="full" mb={2} overflowPadding lazyMount>
      <HStack justify="space-between" borderBottom="sm" borderColor="border">
        {tabs}
        <Collapsible.Trigger asChild>
          <IconButton
            aria-label={t("common.filter")}
            aria-description={
              hasActiveFilters
                ? t("results.records.filters_applied")
                : undefined
            }
            variant="ghost"
            colorPalette={hasActiveFilters ? "blue" : undefined}
            size="sm"
          >
            <Box as="span" position="relative" display="inline-flex">
              <LuFilter />
              {hasActiveFilters && (
                <Float placement="top-end" pointerEvents="none">
                  <Circle
                    as="span"
                    size="1.5"
                    bg="colorPalette.solid"
                    outline="{borders.md}"
                    outlineColor="bg"
                    aria-hidden="true"
                  />
                </Float>
              )}
            </Box>
          </IconButton>
        </Collapsible.Trigger>
      </HStack>
      <Collapsible.Content>
        <Box py={3}>{children}</Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
