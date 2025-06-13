import _ from "lodash";
import countriesReal from "./countries.real.json";
import countriesFictive from "./countries.fictive.json";
import continentDataRaw from "./continents.json";
import eventsDataRaw from "./events.json";
import formatsDataRaw from "./formats.json";
import roundTypesDataRaw from "./round_types.json";

type Country = {
  info: string;
  name: string;
  continentId: string;
  class: string;
  iso2: string;
  id: string;
};

type Continent = {
  id: string;
  name: string;
  recordName: string;
  latitude: number;
  longitude: number;
  zoom: number;
};

type Format = {
  id: string;
  sortBy: string;
  sortBySecond: string;
  expectedSolveCount: number;
  trimFastestN: number;
  trimSowestN: number;
  name: string;
  shortName: string;
  allowedFirstPhaseFormats: string[];
};

type Event = {
  id: string;
  rank: number;
  format: string;
  name: string;
  canChangeTimeLimit: boolean;
  canHaveCutoff: boolean;
  isTimedEvent: boolean;
  isFewestMoves: boolean;
  isMultipleBlindfolded: boolean;
  isOfficial: boolean;
  formatIds: string[];
};

type CamelizedKeys<T> = {
  [K in keyof T as K extends string ? CamelCase<K> : K]: T[K];
};

type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Lowercase<Head>}${Capitalize<CamelCase<Tail>>}`
  : Lowercase<S>;

function camelizeKeys<T extends Record<string, unknown>>(
  obj: T,
): CamelizedKeys<T> {
  return _.mapKeys(obj, (v, k) => _.camelCase(k)) as CamelizedKeys<T>;
}

function loadStaticData<T extends Record<string, unknown>>(
  rawEntities: T[],
): CamelizedKeys<T>[] {
  return rawEntities.map(camelizeKeys);
}

// ----- COUNTRIES -----
const fictionalCountryIds = _.map(countriesFictive, "id");

const countryData = loadStaticData(
  // @ts-expect-error currently the fictive countries don't have the same properties as the real countries so ts isn't happy
  countriesReal.states_lists[0].states.concat(countriesFictive),
);
const realCountryData = countryData.filter(
  (c) => !fictionalCountryIds.includes(c.id),
);

export const countries = {
  byIso2: _.mapValues(_.keyBy(countryData, "iso2"), extendCountries),
  byId: _.mapValues(_.keyBy(countryData, "id"), extendCountries),
  real: _.map(realCountryData, extendCountries),
};

function extendCountries(country: Country) {
  return {
    ...country,
    name: (t: (path: string) => string) => t(`countries.${country.iso2}`),
  };
}

// ----- CONTINENTS -----

const continentData = loadStaticData(continentDataRaw);

const fictionalContinentIds = ["_Multiple Continents"];
const realContinents = continentData.filter(
  (c) => !fictionalContinentIds.includes(c.id),
);

export const continents = {
  real: _.map(realContinents, extendContinents),
};

function extendContinents(continent: Continent) {
  return {
    ...continent,
    name: (t: (path: string) => string) => t(`continents.${continent.name}`),
  };
}

// ----- FORMATS -----

const formatsData = loadStaticData(formatsDataRaw);

export const formats = {
  byId: _.mapValues(_.keyBy(formatsData, "id"), extendFormats),
};

function extendFormats(rawFormat: Format) {
  return {
    ...rawFormat,
    name: (t: (path: string) => string) => t(`formats.${rawFormat.id}`),
    shortName: (t: (path: string) => string) =>
      t(`formats.short.${rawFormat.id}`),
  };
}

// ----- EVENTS -----

const eventsData = loadStaticData(eventsDataRaw);

export const events = {
  official: _.map(_.filter(eventsData, "isOfficial"), extendEvents),
  byId: _.mapValues(_.keyBy(eventsData, "id"), extendEvents),
};

export const WCA_EVENT_IDS = Object.values(events.official).map((e) => e.id);

function extendEvents(rawEvent: Event) {
  return {
    ...rawEvent,
    name: (t: (path: string) => string) => t(`events.${rawEvent.id}`),
    formats() {
      return this.formatIds.map((formatId) => formats.byId[formatId]);
    },
    recommendedFormat() {
      return this.formats()[0];
    },
  };
}
