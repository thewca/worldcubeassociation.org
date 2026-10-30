import { CompetitionNavTab, TabWithLink } from "@/lib/wca/competitions/tabs";
import {
  Box,
  Card,
  SimpleGrid,
  Tabs,
  Link as ChakraLink,
  Stack,
  Text,
} from "@chakra-ui/react";
import { TFunction } from "i18next";
import TabTarget from "../ui/tabTarget";
import IconDisplay from "../IconDisplay";

const groupTabsMap = new Map([
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
  currentPath,
}: {
  tabs: CompetitionNavTab[];
  t: TFunction;
  isAdminRoute: boolean;
  currentPath?: string;
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
      display={{ base: "block", md: "none" }} // mobile only
    >
      <Card.Root variant="elevated" hideFrom="md">
        <Card.Body p={0}>
          <Tabs.Root variant="enclosed">
            <Tabs.List>
              {Object.keys(groupedTabs).length > 1 && (
                <MobileTabList
                  groupedTabs={groupedTabs}
                  isAdminRoute={isAdminRoute}
                  currentPath={currentPath}
                  t={t}
                />
              )}
            </Tabs.List>
          </Tabs.Root>{" "}
        </Card.Body>
      </Card.Root>
    </Box>
  );
}

function MobileTabList({
  groupedTabs,
  t,
  isAdminRoute,
  currentPath,
}: {
  groupedTabs: GroupedTab;
  t: TFunction;
  isAdminRoute: boolean;
  currentPath?: string;
}) {
  return (
    <SimpleGrid columns={[6]}>
      {Object.entries(groupedTabs).map(([group, tabs]) =>
        tabs.length === 1 ? (
          <MobileTabLink
            tab={tabs[0]}
            t={t}
            key={group}
            isAdminRoute={isAdminRoute}
            currentPath={currentPath}
          />
        ) : null,
      )}
    </SimpleGrid>
  );
}

function MobileTabLink({
  tab,
  currentPath,
  isAdminRoute,
  t,
}: {
  tab: CompetitionNavTab;
  isAdminRoute: boolean;
  currentPath?: string;
  t: TFunction;
}) {
  if ("href" in tab)
    return (
      <Tabs.Trigger
        value={tab.menuKey}
        asChild
        disabled={tab.disabled}
        minHeight="fit-content"
        justifyContent="left"
      >
        {tab.externalHref && !tab.disabled ? (
          <ChakraLink
            href={tab.externalHref}
            target="_blank"
            rel="noopener noreferrer"
            color="currentColor"
            textStyle="bodyEmphasis"
            asChild
          >
            <TabLabel tab={tab} t={t} isAdminRoute={isAdminRoute} />
          </ChakraLink>
        ) : (
          <TabTarget
            tabKey={tab.menuKey}
            currentPath={currentPath}
            href={isAdminRoute && tab.hrefAdmin ? tab.hrefAdmin : tab.href}
            disabled={tab.disabled}
            textStyle="bodyEmphasis"
          >
            <TabLabel tab={tab} t={t} isAdminRoute={isAdminRoute} />
          </TabTarget>
        )}
      </Tabs.Trigger>
    );
}

function TabLabel({
  tab,
  t,
  isAdminRoute,
}: {
  tab: TabWithLink;
  t: TFunction;
  isAdminRoute: boolean;
}) {
  const renderLabel = (renderTab: TabWithLink) =>
    t(
      isAdminRoute && renderTab.i18nKeyAdmin
        ? renderTab.i18nKeyAdmin
        : renderTab.i18nKey,
    );
  return (
    <Stack justifyContent="center" alignItems="center" gap={3}>
      {tab.icon !== undefined && <IconDisplay name={tab.icon} />}
      <Text>{renderLabel(tab)}</Text>
    </Stack>
  );
}
