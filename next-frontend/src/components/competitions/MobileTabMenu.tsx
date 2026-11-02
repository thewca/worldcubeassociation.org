import { CompetitionNavTab, TabWithLink } from "@/lib/wca/competitions/tabs";
import {
  Box,
  Card,
  Tabs,
  Link as ChakraLink,
  Stack,
  Text,
  Menu,
  Portal,
  Icon,
} from "@chakra-ui/react";
import { TFunction } from "i18next";
import IconDisplay from "../IconDisplay";
import { LuAArrowDown } from "react-icons/lu";

export const groupTabsMap = new Map([
  ["general", "info"],
  ["register", "register"],
  ["competitors", "info"],
  ["events", "info"],
  ["schedule", "info"],
]);

type GroupedTab = Record<string, CompetitionNavTab[]>;

export default function MobileTabMenu({
  tabs,
  t,
  isAdminRoute,
}: {
  tabs: CompetitionNavTab[];
  t: TFunction;
  isAdminRoute: boolean;
}) {
  const groupedTabs = tabs.reduce((acc, tab) => {
    const group = groupTabsMap.get(tab.menuKey);
    if (group) {
      if (!acc[group]) acc[group] = [];
      acc[group].push(tab);
    }
    return acc;
  }, {} as GroupedTab);
  return (
    <Box
      as="nav"
      aria-label="Competition sections"
      position="fixed"
      insetInline="3"
      bottom="calc(env(safe-area-inset-bottom) + var(--chakra-spacing-4))"
      zIndex="sticky"
      hideFrom="md" // mobile only
    >
      <Card.Root variant="elevated" rounded="3xl">
        <Card.Body p={0}>
          <Tabs.List rounded="3xl">
            {Object.keys(groupedTabs).length > 1 && (
              <MobileTabList
                groupedTabs={groupedTabs}
                isAdminRoute={isAdminRoute}
                t={t}
              />
            )}
            <Tabs.Indicator rounded="l2" />
          </Tabs.List>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}

function MobileTabList({
  groupedTabs,
  t,
  isAdminRoute,
}: {
  groupedTabs: GroupedTab;
  t: TFunction;
  isAdminRoute: boolean;
}) {
  return (
    <>
      {Object.entries(groupedTabs).map(([group, tabs]) => (
        <Tabs.Trigger
          value={group}
          disabled={tabs.every((tab) => tab.disabled)}
          minHeight="fit-content"
          p="0"
          rounded="3xl"
          key={group}
        >
          {tabs.length === 1 ? (
            <MobileTabLink tab={tabs[0]} t={t} isAdminRoute={isAdminRoute} />
          ) : (
            <MobileTabWithSubmenu
              tabs={tabs}
              group={group}
              t={t}
              isAdminRoute={isAdminRoute}
            />
          )}
        </Tabs.Trigger>
      ))}
    </>
  );
}

function MobileTabLink({
  tab,
  isAdminRoute,
  t,
  mode,
}: {
  tab: CompetitionNavTab;
  isAdminRoute: boolean;
  t: TFunction;
  mode?: "vertical" | "horizontal";
}) {
  const renderLabel = (renderTab: TabWithLink) =>
    t(
      isAdminRoute && renderTab.i18nKeyAdmin
        ? renderTab.i18nKeyAdmin
        : renderTab.i18nKey,
    );
  if ("href" in tab)
    return (
      <ChakraLink
        unstyled
        asChild
        href={tab.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        <TabLabel
          text={renderLabel(tab)}
          icon={tab.icon ? <IconDisplay name={tab.icon} size="1.5em" /> : null}
          mode={mode}
        />
      </ChakraLink>
    );
}

function MobileTabWithSubmenu({
  tabs,
  group,
  t,
  isAdminRoute,
}: {
  tabs: CompetitionNavTab[];
  group: string;
  t: TFunction;
  isAdminRoute: boolean;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <TabLabel
          text={group}
          icon={
            <Icon>
              <LuAArrowDown />
            </Icon>
          }
        />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {tabs.map((tab) => (
              <Menu.Item value={tab.menuKey} asChild key={tab.menuKey}>
                <MobileTabLink
                  tab={tab}
                  t={t}
                  isAdminRoute={isAdminRoute}
                  mode="horizontal"
                />
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

function TabLabel({
  text,
  icon,
  mode = "vertical",
}: {
  text: string;
  icon: React.ReactNode | null;
  mode?: "vertical" | "horizontal";
}) {
  return (
    <Stack
      direction={mode === "vertical" ? "column" : "row"}
      justifyContent="center"
      alignItems="center"
      gap={4}
      w="full"
      p="2"
    >
      {icon}
      <Text fontSize="sm">{text}</Text>
    </Stack>
  );
}
