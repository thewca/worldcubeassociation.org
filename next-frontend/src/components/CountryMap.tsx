import { Text } from "@chakra-ui/react";
import WCACountries from "@/lib/wca/data/countries";
import { TFunction } from "i18next";

type CountryMapProps = {
  code: string;
  t: TFunction;
  bold?: boolean;
};

const CountryMap = ({ code, t, bold = false }: CountryMapProps) => {
  const translatedCountryName = t(`countries.${code}`);
  const countryName =
    translatedCountryName ||
    WCACountries.byIso2[code.toUpperCase()].id ||
    "Unknown";
  return <Text fontWeight={bold ? "bold" : "normal"}>{countryName}</Text>;
};

export default CountryMap;
