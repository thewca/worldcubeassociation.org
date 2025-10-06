import { currenciesData } from '../wca-data.js.erb';

// eslint-disable-next-line import/prefer-default-export
export function isoMoneyToHumanReadable(amount, isoCode, name = false) {
  const currency = currenciesData.byIso[isoCode];
  const value = (amount / currency.subunitToUnit).toFixed(2);
  return `${currency.symbol}${value} (${name ? currency.name : isoCode})`;
}
