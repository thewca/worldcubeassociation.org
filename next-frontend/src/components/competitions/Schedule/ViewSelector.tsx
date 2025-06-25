"use client";

import { useT } from "@/lib/i18n/useI18n";
import { Tabs } from "@chakra-ui/react";

const views = ["calendar", "table"];

interface ViewSelectorProps {
  activeView: string;
  setActiveView: (newActiveView: string) => void;
}

export default function ViewSelector({
  activeView,
  setActiveView,
}: ViewSelectorProps) {
  const { t } = useT();

  return (
    <Tabs.Root
      fitted
      value={activeView}
      onValueChange={(e) => setActiveView(e.value)}
    >
      <Tabs.List>
        {views.map((view) => (
          <Tabs.Trigger key={view} value={view}>
            {t(`competitions.schedule.display_as.${view}`)}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
