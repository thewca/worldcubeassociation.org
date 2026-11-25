"use client";

import Link from "next/link";
import {
  Badge,
  Box,
  Collapsible,
  Link as ChakraLink,
  Separator,
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
  TabWithExternalLink,
  TabWithLink,
} from "@/lib/wca/competitions/tabs";
import { useState } from "react";
import { TFunction } from "i18next";
import { LuArrowLeft } from "react-icons/lu";
import type { RouteLiteral } from "nextjs-routes";
import IconDisplay from "@/components/IconDisplay";
import TabTarget from "@/components/ui/tabTarget";
import { route } from "nextjs-routes";
import { Tooltip } from "@/components/ui/tooltip";

export function activityCodeFromPath(path: string) {
  // Matches the eventId out of the path
  return path.match(/^([a-z0-9_]+)(?:-|$)/)?.[1] ?? null;
}

export default function TabMenu({
  competitionInfo,
  tabs,
  backHref,
  customTabs = [],
}: {
  competitionInfo: components["schemas"]["V1CompetitionInfo"];
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
          currentPath={currentPath}
        />
      </Tabs.List>
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
  currentPath,
}: {
  tabs: CompetitionNavTab[];
  t: TFunction;
  isAdminRoute: boolean;
  openGroup: string | null;
  onToggle: (tab: CompetitionNavTab) => void;
  customTabs: string[];
  competitionId: string;
  currentPath?: string;
}) {
  return (
    <>
      {tabs.map((tab) =>
        tab.type !== "tab-with-children" ? (
          <TabLink
            key={tab.menuKey}
            tab={tab}
            t={t}
            isAdminRoute={isAdminRoute}
            currentPath={currentPath}
          />
        ) : (
          <CollapsibleTabGroup
            key={tab.menuKey}
            tab={tab}
            t={t}
            isAdminRoute={isAdminRoute}
            isOpen={openGroup === tab.menuKey}
            onToggle={() => onToggle(tab)}
            currentPath={currentPath}
          />
        ),
      )}
      {customTabs.length > 0 && <Separator />}
      {customTabs.map((tabName) => {
        const tabKey = encodeURIComponent(tabName);

        return (
          <Tabs.Trigger
            key={tabName}
            value={tabKey}
            minHeight="fit-content"
            maxWidth="xs"
            asChild
          >
            <Text textStyle="bodyEmphasis" asChild justifyContent="left">
              <TabTarget
                tabKey={tabKey}
                currentPath={currentPath}
                href={route({
                  pathname:
                    "/competitions/[competitionId]/custom-tabs/[tabName]",
                  query: { competitionId, tabName: tabKey },
                })}
              >
                {tabName}
              </TabTarget>
            </Text>
          </Tabs.Trigger>
        );
      })}
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

export const renderLabel = (
  renderTab: CompetitionNavTab,
  t: TFunction,
  isAdminRoute: boolean,
) =>
  // i18n-tasks-use t('competitions.nav.general')
  // i18n-tasks-use t('competitions.nav.more')
  // i18n-tasks-use t('competitions.nav.admin')
  // i18n-tasks-use t('competitions.nav.results')
  // i18n-tasks-use t('competitions.nav.events')
  t(
    isAdminRoute && renderTab.i18nKeyAdmin
      ? renderTab.i18nKeyAdmin
      : renderTab.i18nKey,
  );

function TabLink({
  tab,
  t,
  isAdminRoute,
  currentPath,
}: {
  tab: TabWithLink | TabWithExternalLink;
  t: TFunction;
  isAdminRoute: boolean;
  currentPath?: string;
}) {
  const trigger = (
    <Tabs.Trigger
      value={tab.menuKey}
      asChild
      disabled={tab.disabled}
      minHeight="fit-content"
      justifyContent="left"
    >
      {tab.type === "tab-with-external-link" ? (
        <ChakraLink
          href={tab.externalHref}
          target="_blank"
          rel="noopener noreferrer"
          color="currentColor"
          textStyle="bodyEmphasis"
        >
          {tab.icon !== undefined && <IconDisplay name={tab.icon} />}
          {renderLabel(tab, t, isAdminRoute)}
        </ChakraLink>
      ) : (
        <TabTarget
          tabKey={tab.menuKey}
          currentPath={currentPath}
          href={isAdminRoute && tab.hrefAdmin ? tab.hrefAdmin : tab.href}
          disabled={tab.disabled}
          textStyle="bodyEmphasis"
        >
          {tab.icon !== undefined && <IconDisplay name={tab.icon} />}
          {renderLabel(tab, t, isAdminRoute)}
        </TabTarget>
      )}
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
  currentPath,
}: {
  tab: TabWithChildren;
  t: TFunction;
  isAdminRoute: boolean;
  isOpen: boolean;
  onToggle: () => void;
  currentPath?: string;
}) {
  const { children } = tab;

  return (
    <Collapsible.Root open={isOpen} onOpenChange={onToggle}>
      <Collapsible.Trigger
        width="full"
        display="flex"
        alignItems="center"
        gap="2"
        textAlign="start"
        textStyle="bodyEmphasis"
        minHeight="fit-content"
        px="3"
        py="2"
        borderRadius="md"
        _hover={{ bg: "bg.subtle" }}
      >
        {tab.icon !== undefined && <IconDisplay name={tab.icon} />}
        {t(tab.i18nKey)}
      </Collapsible.Trigger>

      <Collapsible.Content>
        <Box ps="3" display="flex" flexDirection="column" gap="1" pt="1">
          {children.map((child) => (
            <CollapsibleTabChild
              key={child.menuKey}
              tab={child}
              t={t}
              isAdminRoute={isAdminRoute}
              currentPath={currentPath}
            />
          ))}
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function CollapsibleTabChild({
  tab,
  t,
  isAdminRoute,
  currentPath,
}: {
  tab: TabWithLink | TabWithExternalLink;
  t: TFunction;
  isAdminRoute: boolean;
  currentPath?: string;
}) {
  const link =
    tab.type === "tab-with-external-link" ? (
      <ChakraLink
        href={tab.externalHref}
        target="_blank"
        rel="noopener noreferrer"
        color="currentColor"
        justifyContent="start"
      >
        {tab.icon !== undefined && <IconDisplay name={tab.icon} />}
        {t(tab.i18nKey)}
      </ChakraLink>
    ) : (
      <TabTarget
        tabKey={tab.menuKey}
        currentPath={currentPath}
        href={isAdminRoute && tab.hrefAdmin ? tab.hrefAdmin : tab.href}
        disabled={tab.disabled}
        display="flex"
        justifyContent="space-between"
      >
        {t(tab.i18nKey)}
        {tab.badgeI18nKey && <Badge>{t(tab.badgeI18nKey)}</Badge>}
      </TabTarget>
    );

  return (
    <Tabs.Trigger value={tab.menuKey} asChild disabled={tab.disabled}>
      {link}
    </Tabs.Trigger>
  );
}
