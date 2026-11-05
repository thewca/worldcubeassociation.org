"use client";

import { NativeSelect, Tabs, useTabsContext } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import type { RouteLiteral } from "nextjs-routes";
import type { ChangeEvent } from "react";
import TabTarget from "@/components/ui/tabTarget";

export default function ResponsiveTabsList({
  label,
  items,
}: {
  label: string;
  items: {
    value: string;
    label: string;
    href: RouteLiteral;
  }[];
}) {
  const tabs = useTabsContext();
  const router = useRouter();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const href = items.find((item) => item.value === value)?.href;

    if (href) {
      router.replace(href);
    }
  };

  return (
    <>
      <Tabs.List hideBelow="md">
        {items.map((item) => (
          <Tabs.Trigger value={item.value} key={item.value} asChild>
            <TabTarget
              tabKey={item.value}
              currentPath={tabs.value ?? undefined}
              href={item.href}
              replace
            >
              {item.label}
            </TabTarget>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <NativeSelect.Root hideFrom="md">
        <NativeSelect.Field
          aria-label={label}
          value={tabs.value ?? ""}
          onChange={handleChange}
        >
          {items.map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </>
  );
}
