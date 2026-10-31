import { Badge, FormatNumber, HStack } from "@chakra-ui/react";

export default function CurrencyValue({
  lowestDenomination,
  currencyCode,
  subunitToUnit,
}: {
  lowestDenomination: number | null;
  currencyCode: string;
  subunitToUnit: number;
}) {
  const amount = lowestDenomination ?? 0;

  return (
    <HStack>
      <FormatNumber
        value={amount / subunitToUnit}
        style="currency"
        currency={currencyCode}
      />
      <Badge variant="solid">{currencyCode}</Badge>
    </HStack>
  );
}
