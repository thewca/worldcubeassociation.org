import { Badge, FormatNumber, HStack } from "@chakra-ui/react";
import currencySubunits from "@/lib/staticData/currency_subunits.json";

// Money crosses the API in the currency's smallest unit, and how many of those go into one unit is
//   the currency's own business: 100 for dollars, 1000 for dinars, 1 for yen and forint. The table
//   is the same one the backend bills against - CLDR, which is what `Intl` would answer from,
//   disagrees with it for a number of currencies we take money in.
const subunitsPerUnit = (currencyCode: string) =>
  (currencySubunits as Record<string, number>)[currencyCode] ?? 1;

export default function CurrencyValue({
  lowestDenomination,
  currencyCode,
}: {
  lowestDenomination: number;
  currencyCode: string;
}) {
  return (
    <HStack>
      <FormatNumber
        value={lowestDenomination / subunitsPerUnit(currencyCode)}
        style="currency"
        currency={currencyCode}
      />
      <Badge variant="solid">{currencyCode}</Badge>
    </HStack>
  );
}
