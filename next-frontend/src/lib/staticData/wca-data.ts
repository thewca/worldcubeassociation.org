import _ from "lodash";
import countriesReal from "./countries.real.json";
import countriesFictive from "./countries.fictive.json";
import continentDataRaw from "./continents.json";
import eventsDataRaw from "./events.json";
import formatsDataRaw from "./formats.json";
import roundTypesDataRaw from "./round_types.json";

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

// ----- COUNTRIES -----
const fictionalCountryIds = _.map(countriesFictive, "id");

const countryData = [
  ...countriesReal.states_lists[0].states,
  ...countriesFictive,
];
const realCountryData = countryData.filter(
  (c) => !fictionalCountryIds.includes(c.id),
);

export const countries = {
  byIso2: _.keyBy(countryData, "iso2"),
  byId: _.keyBy(countryData, "id"),
  real: realCountryData,
};

// ----- CONTINENTS -----

const fictionalContinentIds = ["_Multiple Continents"];
const realContinents = continentDataRaw.filter(
  (c) => !fictionalContinentIds.includes(c.id),
);

export const continents = {
  byId: _.keyBy(continentDataRaw, "id"),
  real: realContinents,
};
// ----- FORMATS -----

export const formats = {
  byId: _.keyBy(formatsDataRaw, "id"),
};

// ----- EVENTS -----

export const events = {
  official: _.map(_.filter(eventsDataRaw, "isOfficial"), extendEvents),
  byId: _.mapValues(_.keyBy(eventsDataRaw, "id"), extendEvents),
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

// ----- ROUND TYPES -----

export const roundTypes = {
  byId: _.keyBy(roundTypesDataRaw, "id"),
};
