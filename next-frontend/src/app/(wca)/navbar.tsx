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

type NavbarEntry<T> = {
  targetLink: T;
  displayText: string;
  displayIcon?: IconName;
};

function LinkWrapper<T extends string>({
  navbarEntry,
  linkComponent: LinkComponent,
}: {
  navbarEntry: NavbarEntry<T>;
  linkComponent: React.ElementType<{ href: T }>;
}) {
  // Have to trick the JSX type checker because TS cannot verify
  //   whether "primitive" components like `a` satisfy a generic `href: T`.
  const RawLinkComponent = LinkComponent as React.ElementType;

  return (
    <RawLinkComponent href={navbarEntry.targetLink}>
      {navbarEntry.displayIcon && (
        <IconDisplay name={navbarEntry.displayIcon} />
      )}
      {navbarEntry.displayText}
    </RawLinkComponent>
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
  const socialDropdownLabel = socialLinksGlobal.dropdownLabel ?? "Find Us";

  // Prevent people part of the Live Results Beta to escape onto the payload pages
  const navbarEntries = LIVE_RESULT_BETA ? [] : navbar.entry;
  const showEmptyMessage = !LIVE_RESULT_BETA && navbarEntries.length === 0;

  return (
    <Box borderBottom="md" bg="bg" data-testid="header-navbar">
      <RefreshRouteOnSave />
      <Collapsible.Root>
        <HStack padding="3" justifyContent="space-between">
          <HStack>
            {!LIVE_RESULT_BETA && <WCALogo />}
            <HStack hideBelow="md">
              {navbarEntries.map((navbarEntry) => (
                <React.Fragment key={navbarEntry.id}>
                  {navbarEntry.blockType === "LinkItem" && (
                    <Button asChild variant="ghost" size="sm">
                      <LinkWrapper
                        navbarEntry={navbarEntry}
                        linkComponent={Link}
                      />
                    </Button>
                  )}
                  {navbarEntry.blockType === "ExternalLinkItem" && (
                    <Button asChild variant="ghost" size="sm">
                      <LinkWrapper
                        navbarEntry={navbarEntry}
                        linkComponent="a"
                      />
                    </Button>
                  )}
                  {navbarEntry.blockType === "NavDropdown" && (
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <Button variant="ghost" size="sm">
                          {navbarEntry.displayIcon && (
                            <IconDisplay name={navbarEntry.displayIcon} />
                          )}
                          {navbarEntry.title}
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
                </React.Fragment>
              ))}
              {socialLinks.length > 0 && (
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Button variant="ghost" size="sm">
                      <IconDisplay name="External Link" />
                      {socialDropdownLabel}
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
                          <a
                            href={item.targetLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <IconDisplay name={item.displayIcon as IconName} />
                            {item.displayText}
                          </a>
                        </Menu.Item>
                      ))}
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Root>
              )}
            </HStack>
          </HStack>
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
            <Box hideFrom="md">
              <Collapsible.Trigger asChild>
                <IconButton variant="ghost" aria-label="Toggle navigation">
                  <LuMenu />
                </IconButton>
              </Collapsible.Trigger>
            </Box>
          </HStack>
        </HStack>

        <Box hideFrom="md">
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
                          {navbarEntry.displayIcon && (
                            <IconDisplay name={navbarEntry.displayIcon} />
                          )}
                          {navbarEntry.title}
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
                </React.Fragment>
              ))}
              {socialLinks.length > 0 && (
                <Collapsible.Root>
                  <Collapsible.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      justifyContent="flex-start"
                      width="full"
                    >
                      <IconDisplay name="External Link" />
                      {socialDropdownLabel}
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
                          <a
                            href={item.targetLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <IconDisplay name={item.displayIcon as IconName} />
                            {item.displayText}
                          </a>
                        </Button>
                      ))}
                    </VStack>
                  </Collapsible.Content>
                </Collapsible.Root>
              )}
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
