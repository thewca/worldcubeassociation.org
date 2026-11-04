import {
  Box,
  Card,
  Button,
  Icon,
  Link as ChakraLink,
  Menu,
  Portal,
  Stack,
  type SystemStyleObject,
} from "@chakra-ui/react";
import {
  LuBox,
  LuChevronLeft,
  LuChevronUp,
  LuClipboardList,
  LuEllipsis,
  LuFileQuestion,
  LuLock,
  LuTrophy,
} from "react-icons/lu";
import IconDisplay from "../IconDisplay";
import {
  CompetitionNavTab,
  TabWithChildren,
  TabWithLink,
} from "@/lib/wca/competitions/tabs";
import { TFunction } from "i18next";
import { route } from "nextjs-routes";
import events from "@/lib/wca/data/events";

const groupTabsMap = new Map([
  ["general", "info"],
  ["register", "register"],
  ["competitors", "info"],
  ["events", "info"],
  ["schedule", "info"],
  ["podiums", "results"],
  ["all", "results"],
  ["scrambles", "results"],
  ["byPerson", "results"],
  ["live", "live"],
  ["events", "events"],
]);

const groupIcons = {
  info: <LuClipboardList />,
  register: null,
  more: <LuEllipsis />,
  admin: <LuLock />,
  results: <LuTrophy />,
  events: <LuBox />,
};

const itemStyle: SystemStyleObject = {
  flex: "1",
  minW: "0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1",
  py: "2",
  px: "1",
  rounded: "2xl",
  fontSize: "xs",
  fontWeight: "medium",
  cursor: "pointer",
  _hover: { bg: "bg.muted" },
  _selected: {
    bg: "colorPalette.emphasized",
    color: "white",
    fontWeight: "bold",
  },
  _open: { bg: "colorPalette.subtle", color: "colorPalette.contrast" },
};

type GroupedTab = Record<string, CompetitionNavTab[]>;

export default function MobileTabMenu({
  tabs,
  customTabs = [],
  competitionId,
  t,
  isAdminRoute,
  activeMenuKey,
}: {
  tabs: CompetitionNavTab[];
  customTabs: string[];
  competitionId: string;
  t: TFunction;
  isAdminRoute: boolean;
  activeMenuKey: string;
}) {
  const grouped = tabs.reduce<Record<string, CompetitionNavTab[]>>(
    (acc, tab) => {
      const group = groupTabsMap.get(tab.menuKey);
      if (group) (acc[group] ??= []).push(tab);
      else if (tab.i18nKey.includes("events")) (acc["events"] ??= []).push(tab);
      return acc;
    },
    {} as GroupedTab,
  );

  const custom = customTabs.reduce<Record<string, CompetitionNavTab[]>>(
    (acc, tab) => {
      (acc["more"] ??= []).push({
        menuKey: tab,
        i18nKey: tab,
        href: route({
          pathname: "/competitions/[competitionId]/custom-tabs/[tabName]",
          query: { competitionId, tabName: encodeURIComponent(tab) },
        }),
      });
      return acc;
    },
    {} as GroupedTab,
  );

  const activeGroup = groupTabsMap.has(activeMenuKey)
    ? groupTabsMap.get(activeMenuKey)
    : customTabs.some(
          (tab) =>
            encodeURIComponent(tab) === activeMenuKey || tab === activeMenuKey,
        )
      ? "more"
      : Object.keys(events.byId).some((event) => activeMenuKey.includes(event))
        ? "events"
        : "";

  const renderLabel = (renderTab: CompetitionNavTab) =>
    t(
      isAdminRoute && renderTab.i18nKeyAdmin
        ? renderTab.i18nKeyAdmin
        : renderTab.i18nKey,
    );

  return (
    <Box
      as="nav"
      aria-label="Competition sections"
      position="fixed"
      insetInline="3"
      bottom="calc(env(safe-area-inset-bottom) + var(--chakra-spacing-4))"
      zIndex="sticky"
      hideFrom="md"
    >
      <Card.Root variant="elevated" rounded="3xl" colorPalette="blue">
        <Card.Body p="1" flexDirection="row" gap="1">
          {Object.entries({ ...grouped, ...custom }).map(
            ([group, groupTabs]) =>
              groupTabs.length === 1 && group !== "more" ? (
                <LinkItem
                  key={group}
                  tab={groupTabs[0]}
                  selected={group === activeGroup}
                  renderLabel={renderLabel}
                />
              ) : (
                <GroupItem
                  key={group}
                  group={group}
                  tabs={groupTabs}
                  selected={group === activeGroup}
                  activeMenuKey={activeMenuKey}
                  t={t}
                  renderLabel={renderLabel}
                />
              ),
          )}
        </Card.Body>
      </Card.Root>
    </Box>
  );
}

interface ItemProps {
  tab: CompetitionNavTab;
  selected: boolean;
  renderLabel: (renderTab: CompetitionNavTab) => string;
}

function LinkItem({ tab, selected, renderLabel }: ItemProps) {
  if (!("href" in tab)) return null;
  return (
    <ChakraLink
      unstyled
      href={tab.href}
      css={itemStyle}
      data-selected={selected ? "" : undefined}
      aria-current={selected ? "page" : undefined}
    >
      <ItemLabel
        text={renderLabel(tab)}
        icon={tab.icon && <IconDisplay name={tab.icon} size="1.5em" />}
      />
    </ChakraLink>
  );
}

interface GroupProps {
  group: string;
  tabs: CompetitionNavTab[];
  selected: boolean;
  activeMenuKey: string;
  t: TFunction;
  renderLabel: (renderTab: CompetitionNavTab) => string;
}

function GroupItem({
  group,
  tabs,
  selected,
  activeMenuKey,
  t,
  renderLabel,
}: GroupProps) {
  const groupIcon = groupIcons[group as keyof typeof groupIcons] || (
    <LuFileQuestion />
  );
  return (
    <Menu.Root positioning={{ placement: "top", gutter: 12 }}>
      <Menu.Trigger asChild>
        <Button
          unstyled
          type="button"
          css={itemStyle}
          data-selected={selected ? "" : undefined}
        >
          <ItemLabel
            text={t(`competitions.nav.${group}`)}
            icon={<Icon boxSize="1.5em">{groupIcon}</Icon>}
            chevron
          />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="56" autoFocus={false}>
            {tabs.map((tab) => {
              const isLink = "href" in tab;
              const isActive =
                tab.menuKey === activeMenuKey ||
                encodeURIComponent(tab.menuKey) === activeMenuKey ||
                (group === "events" && activeMenuKey.includes(tab.menuKey));

              const label = renderLabel(tab);
              return (
                <Menu.Item
                  key={tab.menuKey}
                  value={tab.menuKey}
                  asChild={!isLink}
                  disabled={tab.disabled}
                  bg={isActive ? "blue.subtle" : undefined}
                  color={isActive ? "blue.fg" : undefined}
                  fontWeight={isActive ? "bold" : undefined}
                  h="10"
                  fontSize="sm"
                  _highlighted={{ bg: isActive ? "blue.muted" : "bg.muted" }}
                >
                  {isLink ? (
                    <SingleItem tab={tab} label={label} isActive={isActive} />
                  ) : (
                    <ItemWithChildren
                      tab={tab}
                      isItemActive={isActive}
                      renderLabel={renderLabel}
                      activeMenuKey={activeMenuKey}
                    />
                  )}
                </Menu.Item>
              );
            })}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

function ItemLabel({
  text,
  icon,
  chevron,
}: {
  text: string;
  icon?: React.ReactNode;
  chevron?: boolean;
}) {
  return (
    <Stack justify="center" alignItems="center" h="full">
      <Stack direction="row" alignItems="center" gap={0}>
        {icon}{" "}
        {chevron && (
          <Icon size="xs">
            <LuChevronUp />
          </Icon>
        )}
      </Stack>
      <Box
        textAlign="center"
        fontSize="0.72rem"
        fontWeight="medium"
        lineHeight="1.2"
        overflowWrap="anywhere"
        hyphens="auto"
        lineClamp={2}
      >
        {text}
      </Box>
    </Stack>
  );
}

function SingleItem({
  tab,
  label,
  isActive,
}: {
  tab: TabWithLink;
  label: string;
  isActive: boolean;
}) {
  return (
    <ChakraLink
      unstyled
      w="full"
      href={tab.disabled ? undefined : tab.href}
      aria-disabled={tab.disabled || undefined}
      data-disabled={tab.disabled ? "" : undefined}
      tabIndex={tab.disabled ? -1 : undefined}
      onClick={tab.disabled ? (e) => e.preventDefault() : undefined}
      _disabled={{ opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }}
      aria-current={isActive ? "page" : undefined}
    >
      <Stack direction="row" alignItems="center" gap={2}>
        {tab.icon && <IconDisplay name={tab.icon} size="1.25em" />} {label}
      </Stack>
    </ChakraLink>
  );
}

function ItemWithChildren({
  tab,
  activeMenuKey,
  isItemActive,
  renderLabel,
}: {
  tab: TabWithChildren;
  activeMenuKey: string;
  isItemActive: boolean;
  renderLabel: (renderTab: CompetitionNavTab) => string;
}) {
  return (
    <Menu.Root positioning={{ placement: "left", gutter: 2 }}>
      <Menu.TriggerItem color={isItemActive ? "blue.border" : undefined}>
        <LuChevronLeft />
        {tab.icon && <IconDisplay name={tab.icon} size="1.25em" />}
        {renderLabel(tab)}
      </Menu.TriggerItem>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {tab.children.length > 0 &&
              tab.children.map((tab) => {
                const isActive = tab.menuKey === activeMenuKey;
                return (
                  <Menu.Item
                    key={tab.menuKey}
                    value={tab.menuKey}
                    disabled={tab.disabled}
                    bg={isActive ? "blue.subtle" : undefined}
                    color={isActive ? "blue.fg" : undefined}
                    fontWeight={isActive ? "bold" : undefined}
                    _highlighted={{ bg: isActive ? "blue.muted" : "bg.muted" }}
                  >
                    <SingleItem
                      tab={tab}
                      isActive={isActive}
                      label={renderLabel(tab)}
                    />
                  </Menu.Item>
                );
              })}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
