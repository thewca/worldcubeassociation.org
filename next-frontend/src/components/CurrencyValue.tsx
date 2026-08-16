import { Badge, FormatNumber, HStack } from "@chakra-ui/react";
import { LOWEST_DENOMINATION_PER_UNIT } from "@/lib/wca/data/wca";

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
