"use client";

import {
  Box,
  Button,
  ClientOnly,
  Collapsible,
  Menu,
  Skeleton,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { LuChevronDown } from "react-icons/lu";
import {
  coerceLanguageCode,
  fallbackLng,
  storageKey,
} from "@/lib/i18n/settings";
import { availableLocales } from "@/lib/i18n/settings";
import Cookies from "js-cookie";

export default function Wrapper() {
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <LanguageSelector />
    </ClientOnly>
  );
}

const LanguageSelector = () => {
  const currentLocaleRaw = Cookies.get(storageKey) ?? fallbackLng;
  const currentLocale = coerceLanguageCode(currentLocaleRaw);

  const handleChangeLocale = (code: string) => {
    Cookies.set(storageKey, code, { expires: 365, path: "/" });
    // We need to reload because we render a lot of sites on the server
    window.location.reload();
  };

  const currentLanguageLabel = availableLocales[currentLocale]?.name;

  const localeEntries = Object.entries(availableLocales);

  return (
    <>
      {/* Desktop: popup dropdown */}
      <Box hideBelow="md">
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button variant="ghost" size="sm">
              {currentLanguageLabel}
              <LuChevronDown />
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.ItemGroup>
                {localeEntries.map(([lang, cfg]) => (
                  <Menu.Item
                    value={lang}
                    key={lang}
                    onClick={() => handleChangeLocale(lang)}
                  >
                    {cfg.name}
                  </Menu.Item>
                ))}
              </Menu.ItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Box>

      {/* Mobile: inline collapsible */}
      <Box hideFrom="md" width="full">
        <Collapsible.Root>
          <Collapsible.Trigger asChild>
            <Button
              variant="ghost"
              size="sm"
              justifyContent="flex-start"
              width="full"
            >
              {currentLanguageLabel}
              <Collapsible.Indicator ml="auto">
                <LuChevronDown />
              </Collapsible.Indicator>
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <VStack align="stretch">
              {localeEntries.map(([lang, cfg]) => (
                <Button
                  key={lang}
                  variant={lang === currentLocale ? "subtle" : "ghost"}
                  size="sm"
                  justifyContent="flex-start"
                  onClick={() => handleChangeLocale(lang)}
                >
                  {cfg.name}
                </Button>
              ))}
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    </>
  );
};
