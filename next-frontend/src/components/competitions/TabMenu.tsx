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
} from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import _ from "lodash";
import { components } from "@/types/openapi";
import { useT } from "@/lib/i18n/useI18n";
import {
  CompetitionNavTab,
  TabWithChildren,
} from "@/lib/wca/competitions/tabs";
import { useState } from "react";
import { TFunction } from "i18next";
import { LuAlignJustify } from "react-icons/lu";
import { iconMap } from "@/components/icons/iconMap";
import { route } from "nextjs-routes";

export default function TabMenu({
  competitionInfo,
  children,
  tabs,
  isLiveMenu = false,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
  tabs: CompetitionNavTab[];
  isLiveMenu?: boolean;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pathName = usePathname();
  const { t } = useT();

  const path = _.last(pathName.split("/"));
  const currentPath = path === competitionInfo.id ? "general" : path;

  return (
    <Tabs.Root
      variant="enclosed"
      width="full"
      value={currentPath}
      orientation="vertical"
      lazyMount
      unmountOnExit
      colorPalette="white"
    >
      <Tabs.List
        height="fit-content"
        position="sticky"
        width="3xs"
        textAlign="center"
        hideBelow="md"
        gap="3"
      >
        <TabList
          tabs={tabs}
          t={t}
          openGroup={openGroup}
          onToggle={(tab: CompetitionNavTab) =>
            setOpenGroup((prev) => (prev === tab.menuKey ? null : tab.menuKey))
          }
          isLiveMenu={isLiveMenu}
          competitionInfo={competitionInfo}
        />
      </Tabs.List>
      <Box hideFrom="md" mb="4">
        <Drawer.Root
          open={drawerOpen}
          onOpenChange={(e) => setDrawerOpen(e.open)}
          placement="start"
        >
          <Drawer.Trigger asChild>
            <IconButton
              aria-label="Open menu"
              size="sm"
              position="fixed"
              left="3"
              top="3"
              colorPalette="bg"
              variant="ghost"
            >
              <LuAlignJustify />
            </IconButton>
          </Drawer.Trigger>

          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>{competitionInfo.name}</Drawer.Title>
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
                    openGroup={openGroup}
                    onToggle={(tab: CompetitionNavTab) =>
                      setOpenGroup((prev) =>
                        prev === tab.menuKey ? null : tab.menuKey,
                      )
                    }
                    competitionInfo={competitionInfo}
                  />
                </Tabs.List>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Drawer.Root>
      </Box>
      <Tabs.Content width="full" value={currentPath!}>
        {children}
      </Tabs.Content>
    </Tabs.Root>
  );
}

function TabList({
  tabs,
  t,
  onToggle,
  openGroup,
  isLiveMenu,
  competitionInfo,
}: {
  tabs: CompetitionNavTab[];
  t: TFunction;
  openGroup: string | null;
  onToggle: (tab: CompetitionNavTab) => void;
  isLiveMenu?: boolean;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  return (
    <>
      {tabs.map((tab) =>
        "href" in tab ? (
          <Tabs.Trigger value={tab.menuKey} asChild key={tab.menuKey}>
            <Text asChild textStyle="bodyEmphasis" justifyContent="left">
              <Link href={tab.href}>{t(tab.i18nKey)}</Link>
            </Text>
          </Tabs.Trigger>
        ) : (
          <CollapsibleTabGroup
            key={tab.menuKey}
            tab={tab}
            t={t}
            isOpen={openGroup === tab.menuKey}
            onToggle={() => onToggle(tab)}
          />
        ),
      )}
      {!isLiveMenu && (
        <>
          <Separator />
          {competitionInfo.tab_names.map((tabName) => (
            <Tabs.Trigger
              key={tabName}
              value={tabName}
              minHeight="fit-content"
              asChild
            >
              <Text
                textStyle="bodyEmphasis"
                asChild
                maxW="44"
                justifyContent="left"
              >
                <Link
                  href={route({
                    pathname: "/competitions/[competitionId]/tabs/[tabName]",
                    query: {
                      competitionId: competitionInfo.id,
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
      )}
    </>
  );
}

function CollapsibleTabGroup({
  tab,
  t,
  isOpen,
  onToggle,
}: {
  tab: TabWithChildren;
  t: TFunction;
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
        justifyContent="space-between"
        px="3"
        py="2"
        borderRadius="md"
        _hover={{ bg: "bg.subtle" }}
        cursor="pointer"
      >
        <Text textStyle="bodyEmphasis">
          <IconComponent /> {t(i18nKey)}
        </Text>
      </Collapsible.Trigger>

      <Collapsible.Content>
        <Box pl="3" display="flex" flexDirection="column" gap="1" pt="1">
          {children.map(({ menuKey, disabled, i18nKey, href, badge }) => (
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
                  <Link href={href}>
                    {t(i18nKey)} <Spacer /> <Badge>{badge}</Badge>
                  </Link>
                )}
              </Text>
            </Tabs.Trigger>
          ))}
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
