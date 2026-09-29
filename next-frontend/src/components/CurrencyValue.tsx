import { Badge, FormatNumber, HStack } from "@chakra-ui/react";
import { dinero, toDecimal } from "dinero.js";
import * as currencies from "dinero.js/currencies";
import type { DineroCurrency } from "dinero.js";

const currencyTable: Record<string, DineroCurrency<number>> = currencies;

export default function CurrencyValue({
  lowestDenomination,
  currencyCode,
}: {
  lowestDenomination: number | null;
  currencyCode: string;
}) {
  const currency = currencyTable[currencyCode];
  const amount = lowestDenomination ?? 0;

  return (
    <HStack>
      <FormatNumber
        value={
          currency ? Number(toDecimal(dinero({ amount, currency }))) : amount
        }
        style="currency"
        currency={currencyCode}
      />
      <Badge variant="solid">{currencyCode}</Badge>
    </HStack>
  );
}
