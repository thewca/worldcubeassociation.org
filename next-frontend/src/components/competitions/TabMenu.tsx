"use client";

import Link from "next/link";
import {
  Badge,
  Box,
  CloseButton,
  Collapsible,
  Drawer,
  IconButton,
  Separator,
  Spacer,
  Tabs,
  Text,
  TextProps,
} from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import _ from "lodash";
import { components } from "@/types/openapi";
import { useT } from "@/lib/i18n/useI18n";
import {
  CompetitionNavTab,
  TabWithChildren,
  TabWithLink,
} from "@/lib/wca/competitions/tabs";
import { useState } from "react";
import { TFunction } from "i18next";
import { LuAlignJustify, LuArrowLeft } from "react-icons/lu";
import type { RouteLiteral } from "nextjs-routes";
import { iconMap } from "@/components/icons/iconMap";
import { route } from "nextjs-routes";
import { Tooltip } from "@/components/ui/tooltip";

function activityCodeFromPath(path: string) {
  // Matches the eventId out of the path
  return path.match(/^([a-z0-9_]+)(?:-|$)/)?.[1] ?? null;
}

export default function TabMenu({
  competitionInfo,
  tabs,
  backHref,
  customTabs = [],
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  tabs: CompetitionNavTab[];
  backHref?: RouteLiteral;
  customTabs?: string[];
}) {
  const pathName = usePathname();
  const { t } = useT();

  const isAdminRoute = pathName.includes("/admin");
  const path = _.last(pathName.split("/"));
  const currentPath = path === competitionInfo.id ? "general" : path;

  const eventId = activityCodeFromPath(currentPath!);

  const [openGroup, setOpenGroup] = useState<string | null>(eventId);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Tabs.List
        width="fit-content"
        minW="3xs"
        textAlign="start"
        hideBelow="md"
        gap="3"
      >
        {backHref && (
          <BackLink
            href={backHref}
            label={competitionInfo.name}
            px="3"
            py="2"
          />
        )}
        <TabList
          tabs={tabs}
          t={t}
          isAdminRoute={isAdminRoute}
          openGroup={openGroup}
          onToggle={(tab: CompetitionNavTab) =>
            setOpenGroup((prev) => (prev === tab.menuKey ? null : tab.menuKey))
          }
          customTabs={customTabs}
          competitionId={competitionInfo.id}
        />
      </Tabs.List>
      <Box hideFrom="md">
        <Drawer.Root
          open={drawerOpen}
          onOpenChange={(e) => setDrawerOpen(e.open)}
          placement="start"
        >
          <Drawer.Trigger asChild>
            <IconButton
              aria-label="Open menu"
              size="lg"
              position="fixed"
              right="4"
              bottom="4"
              zIndex="docked"
              rounded="full"
              shadow="lg"
            >
              <LuAlignJustify />
            </IconButton>
          </Drawer.Trigger>

          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>
                  {backHref ? (
                    <BackLink
                      href={backHref}
                      label={competitionInfo.name}
                      onClick={() => setDrawerOpen(false)}
                    />
                  ) : (
                    competitionInfo.name
                  )}
                </Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <CloseButton />
                </Drawer.CloseTrigger>
              </Drawer.Header>

              <Drawer.Body>
                <Tabs.List
                  flexDirection="column"
                  gap="1"
                  borderInlineEnd="none"
                  w="100%"
                  bg="none"
                >
                  <TabList
                    tabs={tabs}
                    t={t}
                    isAdminRoute={isAdminRoute}
                    openGroup={openGroup}
                    onToggle={(tab: CompetitionNavTab) =>
                      setOpenGroup((prev) =>
                        prev === tab.menuKey ? null : tab.menuKey,
                      )
                    }
                    customTabs={customTabs}
                    competitionId={competitionInfo.id}
                  />
                </Tabs.List>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Drawer.Root>
      </Box>
    </>
  );
}

function TabList({
  tabs,
  t,
  isAdminRoute,
  onToggle,
  openGroup,
  customTabs,
  competitionId,
}: {
  tabs: CompetitionNavTab[];
  t: TFunction;
  isAdminRoute: boolean;
  openGroup: string | null;
  onToggle: (tab: CompetitionNavTab) => void;
  customTabs: string[];
  competitionId: string;
}) {
  return (
    <>
      {tabs.map((tab) =>
        "href" in tab ? (
          <TabLink
            key={tab.menuKey}
            tab={tab}
            t={t}
            isAdminRoute={isAdminRoute}
          />
        ) : (
          <CollapsibleTabGroup
            key={tab.menuKey}
            tab={tab}
            t={t}
            isAdminRoute={isAdminRoute}
            isOpen={openGroup === tab.menuKey}
            onToggle={() => onToggle(tab)}
          />
        ),
      )}
      {customTabs.length > 0 && <Separator />}
      {customTabs.map((tabName) => (
        <Tabs.Trigger
          key={tabName}
          value={encodeURIComponent(tabName)}
          minHeight="fit-content"
          maxWidth="xs"
          asChild
        >
          <Text textStyle="bodyEmphasis" asChild justifyContent="left">
            <Link
              href={route({
                pathname: "/competitions/[competitionId]/tabs/[tabName]",
                query: {
                  competitionId,
                  tabName: encodeURIComponent(tabName),
                },
              })}
            >
              {tabName}
            </Link>
          </Text>
        </Tabs.Trigger>
      ))}
    </>
  );
}

function BackLink({
  href,
  label,
  onClick,
  ...rest
}: TextProps & {
  href: RouteLiteral;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Text
      asChild
      display="inline-flex"
      alignItems="center"
      gap="2"
      textStyle="bodyEmphasis"
      {...rest}
    >
      <Link href={href} onClick={onClick}>
        <LuArrowLeft />
        {label}
      </Link>
    </Text>
  );
}

function TabLink({
  tab,
  t,
  isAdminRoute,
}: {
  tab: TabWithLink;
  t: TFunction;
  isAdminRoute: boolean;
}) {
  const label = t(
    isAdminRoute && tab.i18nKeyAdmin ? tab.i18nKeyAdmin : tab.i18nKey,
  );

  const trigger = (
    <Tabs.Trigger
      value={tab.menuKey}
      asChild
      disabled={tab.disabled}
      minHeight="fit-content"
    >
      <Text asChild textStyle="bodyEmphasis" justifyContent="left">
        {tab.disabled ? (
          <Text>{label}</Text>
        ) : tab.externalHref ? (
          <a href={tab.externalHref} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ) : (
          <Link href={isAdminRoute && tab.hrefAdmin ? tab.hrefAdmin : tab.href}>
            {label}
          </Link>
        )}
      </Text>
    </Tabs.Trigger>
  );

  if (!tab.tooltipI18nKey) return trigger;

  return (
    <Tooltip content={t(tab.tooltipI18nKey)} showArrow openDelay={200}>
      {trigger}
    </Tooltip>
  );
}

function CollapsibleTabGroup({
  tab,
  t,
  isAdminRoute,
  isOpen,
  onToggle,
}: {
  tab: TabWithChildren;
  t: TFunction;
  isAdminRoute: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { i18nKey, icon, children } = tab;
  const IconComponent = iconMap[icon];

  return (
    <Collapsible.Root open={isOpen} onOpenChange={onToggle}>
      <Collapsible.Trigger
        width="full"
        display="flex"
        textAlign="start"
        minHeight="fit-content"
        px="3"
        py="2"
        borderRadius="md"
        _hover={{ bg: "bg.subtle" }}
      >
        <Text textStyle="bodyEmphasis">
          <IconComponent /> {t(i18nKey)}
        </Text>
      </Collapsible.Trigger>

      <Collapsible.Content>
        <Box pl="3" display="flex" flexDirection="column" gap="1" pt="1">
          {children.map(
            ({ menuKey, disabled, i18nKey, href, hrefAdmin, badgeI18nKey }) => (
              <Tabs.Trigger
                value={menuKey}
                asChild
                key={menuKey}
                disabled={disabled}
              >
                <Text asChild justifyContent="left">
                  {disabled ? (
                    <Text>{t(i18nKey)}</Text>
                  ) : (
                    <Link href={isAdminRoute && hrefAdmin ? hrefAdmin : href}>
                      {t(i18nKey)} <Spacer />
                      {badgeI18nKey && <Badge>{t(badgeI18nKey)}</Badge>}
                    </Link>
                  )}
                </Text>
              </Tabs.Trigger>
            ),
          )}
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
