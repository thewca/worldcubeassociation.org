import _ from "lodash";
import countriesReal from "./countries.real.json";
import countriesFictive from "./countries.fictive.json";
import continentDataRaw from "./continents.json";
import eventsDataRaw from "./events.json";
import formatsDataRaw from "./formats.json";
import roundTypesDataRaw from "./round_types.json";

const camelizeKeys = (obj) => _.mapKeys(obj, (v, k) => _.camelCase(k));

const loadStaticData = (rawEntities) => {
  return _.map(rawEntities, camelizeKeys);
};

// ----- COUNTRIES -----
const fictionalCountryIds = _.map(countriesFictive, "id");

const countryData = loadStaticData(
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

function extendCountries(country) {
  return {
    ...country,
    name: (t) => t(`countries.${country.iso2}`),
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

function extendContinents(continent) {
  return {
    ...continent,
    name: (t) => t(`continents.${continent.name}`),
  };
}

// ----- FORMATS -----

const formatsData = loadStaticData(formatsDataRaw);

export const formats = {
  byId: _.mapValues(_.keyBy(formatsData, "id"), extendFormats),
};

function extendFormats(rawFormat) {
  return {
    ...rawFormat,
    name: (t) => t(`formats.${rawFormat.id}`),
    shortName: (t) => t(`formats.short.${rawFormat.id}`),
  };
}

// ----- EVENTS -----

const eventsData = loadStaticData(eventsDataRaw);

export const events = {
  official: _.map(_.filter(eventsData, "isOfficial"), extendEvents),
  byId: _.mapValues(_.keyBy(eventsData, "id"), extendEvents),
};

export const WCA_EVENT_IDS = Object.values(events.official).map((e) => e.id);

function extendEvents(rawEvent) {
  return {
    ...rawEvent,
    name: (t) => t(`events.${rawEvent.id}`),
    formats() {
      return this.formatIds.map(roundTypesDataRaw);
    },
    recommendedFormat() {
      return this.formats()[0];
    },
  };
}
