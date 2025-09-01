"use client";

import { Text } from "@chakra-ui/react";
import WCACountries from "@/lib/wca/data/countries";
import { useT } from "@/lib/i18n/useI18n";

type CountryMapProps = {
  code: string;
  bold?: boolean;
};

const CountryMap = ({ code, bold = false }: CountryMapProps) => {
  const { t } = useT();
  const translatedCountryName = t(`countries.${code}`);
  const countryName =
    translatedCountryName ||
    WCACountries.byIso2[code.toUpperCase()].id ||
    "Unknown";
  return <Text fontWeight={bold ? "bold" : "normal"}>{countryName}</Text>;
};

export default CountryMap;
