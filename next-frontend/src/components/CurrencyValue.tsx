import { Badge, FormatNumber, HStack, Span } from "@chakra-ui/react";
import currencies from "@/lib/staticData/currencies.json";

type Currency = (typeof currencies)[keyof typeof currencies];

const currencyTable: Record<string, Currency> = currencies;

export default function CurrencyValue({
  lowestDenomination,
  currencyCode,
}: {
  lowestDenomination: number | null;
  currencyCode: string;
}) {
  const currency = currencyTable[currencyCode];
  const amount = (lowestDenomination ?? 0) / currency.subunit_to_unit;

  return (
    <HStack>
      <Span>
        {currency.symbol_first && currency.symbol}
        <FormatNumber
          value={amount}
          minimumFractionDigits={
            Number.isInteger(amount) ? 0 : currency.decimal_places
          }
          maximumFractionDigits={currency.decimal_places}
        />
        {!currency.symbol_first && ` ${currency.symbol}`}
      </Span>
      <Badge variant="solid">{currencyCode}</Badge>
    </HStack>
  );
}
