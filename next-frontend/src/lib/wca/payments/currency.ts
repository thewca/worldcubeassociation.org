import type { DineroCurrency } from "dinero.js";
import * as currencies from "dinero.js/currencies";

const currencyTable: Record<string, DineroCurrency<number>> = currencies;

/**
 * How many of a currency's lowest denomination go into one unit: a hundred cents to the euro, but
 * one yen to the yen. Amounts cross the API in the lowest denomination, while the donation field
 * asks the competitor for units.
 */
export function lowestDenominationsPerUnit(currencyCode: string) {
  const currency = currencyTable[currencyCode];

  if (!currency) {
    return 1;
  }

  // The only currencies with a non-numeric base are the two non-decimal ones (MGA and MRU), whose
  //   sub-unit is too small to be worth offering as a donation.
  const base = typeof currency.base === "number" ? currency.base : 1;

  return base ** currency.exponent;
}
