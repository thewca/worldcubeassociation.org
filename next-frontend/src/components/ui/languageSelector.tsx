"use client";

import { Menu, Button } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import { fallbackLng, languages, storageKey } from "@/lib/i18n/settings";
import Cookies from "js-cookie";

const LanguageSelector = () => {
  const [currentLocale, setCurrentLocale] = useState(fallbackLng);

  useEffect(() => {
    const storedLocale = Cookies.get(storageKey);
    if (storedLocale) {
      setCurrentLocale(storedLocale);
    }
  }, []);

  const handleChangeLocale = (code: string) => {
    Cookies.set(storageKey, code, { expires: 365, path: "/" });
    setCurrentLocale(code);
    window.location.reload();
  };

  const currentLanguageLabel = languages.find((lang) => lang === currentLocale);

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="ghost" size="sm">
          {currentLanguageLabel}
          <LuChevronDown />
        </Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.ItemGroup>
          {languages.map((lang) => (
            <Menu.Item
              value={lang}
              key={lang}
              onClick={() => handleChangeLocale(lang)}
            >
              {lang}
            </Menu.Item>
          ))}
        </Menu.ItemGroup>
      </Menu.Content>
    </Menu.Root>
  );
};

export default LanguageSelector;
