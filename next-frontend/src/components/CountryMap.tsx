import React, { ComponentPropsWithoutRef } from "react";
import { Text } from "@chakra-ui/react";
import WCACountries from "@/lib/wca/data/countries";
import { TFunction } from "i18next";

type TextProps = ComponentPropsWithoutRef<typeof Text>;

type CountryMapProps = {
  code: string;
  t: TFunction;
} & TextProps;

export const countryName = (code: string, t: TFunction) =>
  t(`countries.${code}`) ||
  WCACountries.byIso2[code.toUpperCase()].id ||
  "Unknown";

const CountryMap = ({ code, t, ...textProps }: CountryMapProps) => (
  <Text {...textProps}>{countryName(code, t)}</Text>
);

export default CountryMap;
