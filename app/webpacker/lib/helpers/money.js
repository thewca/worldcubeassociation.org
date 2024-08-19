import { currenciesData } from '../wca-data.js.erb';

export function isoMoneyToHumanReadable(amount, isoCode, name = false) {
  const currency = currenciesData.byIso[isoCode];
  return `${currency.symbol}${amount
  / currency.subunitToUnit} (${name ? currency.name : isoCode})`;
}
