import { Badge, FormatNumber, HStack } from "@chakra-ui/react";

// Money crosses the API in the currency's smallest unit (cents, pence, yen).
const LOWEST_DENOMINATION_PER_UNIT = 100;

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
        value={lowestDenomination / LOWEST_DENOMINATION_PER_UNIT}
        style="currency"
        currency={currencyCode}
      />
      <Badge variant="solid">{currencyCode}</Badge>
    </HStack>
  );
}
