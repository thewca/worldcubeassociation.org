import currenciesData from "../../staticData/currencies.json";

export type Currency = (typeof currenciesData)[keyof typeof currenciesData];

const currencyTable: Record<string, Currency> = currenciesData;

const currencies = {
  byIsoCode: currencyTable,
};

export default currencies;
