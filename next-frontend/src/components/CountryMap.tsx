import React, { ComponentPropsWithoutRef } from "react";
import { Text } from "@chakra-ui/react";
import WCACountries from "@/lib/wca/data/countries";
import { TFunction } from "i18next";

type TextProps = ComponentPropsWithoutRef<typeof Text>;

type CountryMapProps = {
  code: string;
  t: TFunction;
} & TextProps;

const CountryMap = ({ code, t, ...textProps }: CountryMapProps) => {
  const translatedCountryName = t(`countries.${code}`);

  const countryName =
    translatedCountryName ||
    WCACountries.byIso2[code.toUpperCase()].id ||
    "Unknown";

  return <Text {...textProps}>{countryName}</Text>;
};

export default CountryMap;
