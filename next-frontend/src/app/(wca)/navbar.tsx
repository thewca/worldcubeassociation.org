import React from "react";
import {
  Box,
  Button,
  Collapsible,
  HStack,
  IconButton,
  Menu,
  Separator,
  Text,
  VStack,
  Icon,
} from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import Link from "next/link";
import { auth } from "@/auth";
import { RefreshRouteOnSave } from "@/components/RefreshRouteOnSave";
import { ColorModeButton } from "@/components/ui/color-mode";
import { LuChevronDown, LuMenu } from "react-icons/lu";

import LanguageSelector from "@/components/ui/languageSelector";
import IconDisplay from "@/components/IconDisplay";
import type { IconName } from "@/types/payload";
import AvatarMenu from "@/components/ui/avatarMenu";
import WCALogo from "@/components/WCALogo";
import WcaSearch from "@/components/SearchBar/WcaSearch";

type NavbarEntry<K extends string = "displayText"> = {
  [P in K]: string;
} & {
  displayIcon?: IconName;
};

function TextWrapper<K extends string>({
  navbarEntry,
  entryKey,
  hideResponsive = false,
}: {
  navbarEntry: NavbarEntry<K>;
  entryKey: K;
  hideResponsive?: boolean;
}) {
  return (
    <>
      {navbarEntry.displayIcon && (
        <IconDisplay name={navbarEntry.displayIcon} />
      )}
      <Box
        as="span"
        hideBelow={hideResponsive && navbarEntry.displayIcon ? "xl" : undefined}
      >
        {navbarEntry[entryKey]}
      </Box>
    </>
  );
}

type LinkNavbarEntry<T> = NavbarEntry & {
  targetLink: T;
};

function LinkWrapper<T extends string>({
  navbarEntry,
  linkComponent: LinkComponent,
  hideResponsive = false,
  ...extraProps
}: {
  navbarEntry: LinkNavbarEntry<T>;
  linkComponent: React.ComponentType<{ href: T }> | "a";
  hideResponsive?: boolean;
} & React.ComponentPropsWithoutRef<"a">) {
  return (
    <LinkComponent {...extraProps} href={navbarEntry.targetLink}>
      <TextWrapper
        navbarEntry={navbarEntry}
        entryKey="displayText"
        hideResponsive={hideResponsive}
      />
    </LinkComponent>
  );
}

const LIVE_RESULT_BETA = !!process.env.LIVE_RESULT_BETA;

export default async function Navbar() {
  const payload = await getPayload({ config });
  const [navbar, socialLinksGlobal] = await Promise.all([
    payload.findGlobal({ slug: "nav" }),
    payload.findGlobal({ slug: "social-links" }),
  ]);

  const session = await auth();
  const socialLinks = socialLinksGlobal.links ?? [];

  // Prevent people part of the Live Results Beta to escape onto the payload pages
  const navbarEntries = LIVE_RESULT_BETA ? [] : navbar.entry;
  const showEmptyMessage = !LIVE_RESULT_BETA && navbarEntries.length === 0;

  return (
    <Box
      borderBottom="md"
      borderColor="border"
      bg="bg"
      data-testid="header-navbar"
    >
      <RefreshRouteOnSave />
      <Collapsible.Root>
        <HStack padding="3" justifyContent="space-between">
          <HStack>
            {!LIVE_RESULT_BETA && <WCALogo />}
            <Box hideFrom="xl">
              <Collapsible.Trigger asChild>
                <IconButton variant="ghost" aria-label="Toggle navigation">
                  <Icon size="lg" asChild>
                    <LuMenu />
                  </Icon>
                </IconButton>
              </Collapsible.Trigger>
            </Box>
            <HStack hideBelow="xl" gap={0}>
              {navbarEntries.map((navbarEntry) => (
                <React.Fragment key={navbarEntry.id}>
                  {navbarEntry.blockType === "LinkItem" && (
                    <Button asChild variant="ghost" size="sm" px="2">
                      <LinkWrapper
                        navbarEntry={navbarEntry}
                        linkComponent={Link}
                        hideResponsive
                      />
                    </Button>
                  )}
                  {navbarEntry.blockType === "ExternalLinkItem" && (
                    <Button asChild variant="ghost" size="sm" px="2">
                      <LinkWrapper
                        navbarEntry={navbarEntry}
                        linkComponent="a"
                        hideResponsive
                      />
                    </Button>
                  )}
                  {navbarEntry.blockType === "NavDropdown" && (
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <Button variant="ghost" size="sm" px="2">
                          <TextWrapper
                            navbarEntry={navbarEntry}
                            entryKey="title"
                            hideResponsive
                          />
                          <LuChevronDown />
                        </Button>
                      </Menu.Trigger>
                      <Menu.Positioner>
                        <Menu.Content>
                          {navbarEntry.entries.map((subEntry) => (
                            <React.Fragment key={subEntry.id}>
                              {subEntry.blockType === "LinkItem" && (
                                <Menu.Item
                                  value={`${navbarEntry.id}/${subEntry.id}`}
                                  asChild
                                >
                                  <LinkWrapper
                                    navbarEntry={subEntry}
                                    linkComponent={Link}
                                  />
                                </Menu.Item>
                              )}
                              {subEntry.blockType === "ExternalLinkItem" && (
                                <Menu.Item
                                  value={`${navbarEntry.id}/${subEntry.id}`}
                                  asChild
                                >
                                  <LinkWrapper
                                    navbarEntry={subEntry}
                                    linkComponent="a"
                                  />
                                </Menu.Item>
                              )}
                              {subEntry.blockType === "VisualDivider" && (
                                <Menu.Separator />
                              )}
                              {subEntry.blockType === "NestedDropdown" && (
                                <Menu.Root
                                  positioning={{
                                    placement: "right-start",
                                    gutter: -2,
                                  }}
                                >
                                  <Menu.TriggerItem>
                                    {subEntry.title}
                                  </Menu.TriggerItem>
                                  <Menu.Positioner>
                                    <Menu.Content>
                                      {subEntry.entries.map((nestedEntry) => (
                                        <React.Fragment key={nestedEntry.id}>
                                          {nestedEntry.blockType ===
                                            "LinkItem" && (
                                            <Menu.Item
                                              value={`${navbarEntry.id}/${subEntry.id}/${nestedEntry.id}`}
                                              asChild
                                            >
                                              <LinkWrapper
                                                navbarEntry={nestedEntry}
                                                linkComponent={Link}
                                              />
                                            </Menu.Item>
                                          )}
                                          {nestedEntry.blockType ===
                                            "ExternalLinkItem" && (
                                            <Menu.Item
                                              value={`${navbarEntry.id}/${subEntry.id}/${nestedEntry.id}`}
                                              asChild
                                            >
                                              <LinkWrapper
                                                navbarEntry={nestedEntry}
                                                linkComponent="a"
                                              />
                                            </Menu.Item>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </Menu.Content>
                                  </Menu.Positioner>
                                </Menu.Root>
                              )}
                            </React.Fragment>
                          ))}
                        </Menu.Content>
                      </Menu.Positioner>
                    </Menu.Root>
                  )}
                  {navbarEntry.blockType === "SocialsMenu" &&
                    socialLinks.length > 0 && (
                      <Menu.Root>
                        <Menu.Trigger asChild>
                          <Button variant="ghost" size="sm">
                            <TextWrapper
                              navbarEntry={{
                                ...navbarEntry,
                                displayIcon: "External Link",
                              }}
                              entryKey="label"
                              hideResponsive
                            />
                            <LuChevronDown />
                          </Button>
                        </Menu.Trigger>
                        <Menu.Positioner>
                          <Menu.Content>
                            {socialLinks.map((item) => (
                              <Menu.Item
                                key={item.id}
                                value={item.id ?? item.targetLink}
                                asChild
                              >
                                <LinkWrapper
                                  navbarEntry={item}
                                  linkComponent="a"
                                  target="_blank"
                                  rel="noreferrer"
                                />
                              </Menu.Item>
                            ))}
                          </Menu.Content>
                        </Menu.Positioner>
                      </Menu.Root>
                    )}
                </React.Fragment>
              ))}
            </HStack>
          </HStack>
          <Box flex="1" mx={4}>
            <WcaSearch />
          </Box>
          <HStack>
            {showEmptyMessage && (
              <Text hideBelow="md">Oh no, there are no navbar items!</Text>
            )}
            <ColorModeButton />
            <Box hideBelow="md">
              <LanguageSelector />
            </Box>
            <Box hideBelow="md">
              <AvatarMenu session={session} />
            </Box>
          </HStack>
        </HStack>

        <Box hideFrom="xl">
          <Collapsible.Content>
            <VStack align="stretch" px={3} pb={3} gap={1}>
              {showEmptyMessage && (
                <Text>Oh no, there are no navbar items!</Text>
              )}
              {navbarEntries.map((navbarEntry) => (
                <React.Fragment key={navbarEntry.id}>
                  {navbarEntry.blockType === "LinkItem" && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      justifyContent="flex-start"
                    >
                      <LinkWrapper
                        navbarEntry={navbarEntry}
                        linkComponent={Link}
                      />
                    </Button>
                  )}
                  {navbarEntry.blockType === "ExternalLinkItem" && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      justifyContent="flex-start"
                    >
                      <LinkWrapper
                        navbarEntry={navbarEntry}
                        linkComponent="a"
                      />
                    </Button>
                  )}
                  {navbarEntry.blockType === "NavDropdown" && (
                    <Collapsible.Root>
                      <Collapsible.Trigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          justifyContent="flex-start"
                          width="full"
                        >
                          <TextWrapper
                            navbarEntry={navbarEntry}
                            entryKey="title"
                          />
                          <Collapsible.Indicator ml="auto">
                            <LuChevronDown />
                          </Collapsible.Indicator>
                        </Button>
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <VStack align="stretch" pl={4} gap={1} py={1}>
                          {navbarEntry.entries.map((subEntry) => (
                            <React.Fragment key={subEntry.id}>
                              {subEntry.blockType === "LinkItem" && (
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="sm"
                                  justifyContent="flex-start"
                                >
                                  <LinkWrapper
                                    navbarEntry={subEntry}
                                    linkComponent={Link}
                                  />
                                </Button>
                              )}
                              {subEntry.blockType === "ExternalLinkItem" && (
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="sm"
                                  justifyContent="flex-start"
                                >
                                  <LinkWrapper
                                    navbarEntry={subEntry}
                                    linkComponent="a"
                                  />
                                </Button>
                              )}
                              {subEntry.blockType === "VisualDivider" && (
                                <Separator />
                              )}
                              {subEntry.blockType === "NestedDropdown" && (
                                <Collapsible.Root>
                                  <Collapsible.Trigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      justifyContent="flex-start"
                                      width="full"
                                    >
                                      {subEntry.title}
                                      <Collapsible.Indicator ml="auto">
                                        <LuChevronDown />
                                      </Collapsible.Indicator>
                                    </Button>
                                  </Collapsible.Trigger>
                                  <Collapsible.Content>
                                    <VStack
                                      align="stretch"
                                      pl={4}
                                      gap={1}
                                      py={1}
                                    >
                                      {subEntry.entries.map((nestedEntry) => (
                                        <React.Fragment key={nestedEntry.id}>
                                          {nestedEntry.blockType ===
                                            "LinkItem" && (
                                            <Button
                                              asChild
                                              variant="ghost"
                                              size="sm"
                                              justifyContent="flex-start"
                                            >
                                              <LinkWrapper
                                                navbarEntry={nestedEntry}
                                                linkComponent={Link}
                                              />
                                            </Button>
                                          )}
                                          {nestedEntry.blockType ===
                                            "ExternalLinkItem" && (
                                            <Button
                                              asChild
                                              variant="ghost"
                                              size="sm"
                                              justifyContent="flex-start"
                                            >
                                              <LinkWrapper
                                                navbarEntry={nestedEntry}
                                                linkComponent="a"
                                              />
                                            </Button>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </VStack>
                                  </Collapsible.Content>
                                </Collapsible.Root>
                              )}
                            </React.Fragment>
                          ))}
                        </VStack>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  )}
                  {navbarEntry.blockType === "SocialsMenu" &&
                    socialLinks.length > 0 && (
                      <Collapsible.Root>
                        <Collapsible.Trigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            justifyContent="flex-start"
                            width="full"
                          >
                            <TextWrapper
                              navbarEntry={{
                                ...navbarEntry,
                                displayIcon: "External Link",
                              }}
                              entryKey="label"
                            />
                            <Collapsible.Indicator ml="auto">
                              <LuChevronDown />
                            </Collapsible.Indicator>
                          </Button>
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <VStack align="stretch" pl={4} gap={1} py={1}>
                            {socialLinks.map((item) => (
                              <Button
                                key={item.id}
                                asChild
                                variant="ghost"
                                size="sm"
                                justifyContent="flex-start"
                              >
                                <LinkWrapper
                                  navbarEntry={item}
                                  linkComponent="a"
                                  target="_blank"
                                  rel="noreferrer"
                                />
                              </Button>
                            ))}
                          </VStack>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    )}
                </React.Fragment>
              ))}
              <Separator />
              <VStack align="start">
                <LanguageSelector />
                <AvatarMenu session={session} />
              </VStack>
            </VStack>
          </Collapsible.Content>
        </Box>
      </Collapsible.Root>
    </Box>
  );
}
