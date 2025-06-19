import _ from "lodash";
import continentDataRaw from "./continents.json";
import eventsDataRaw from "./events.json";
import formatsDataRaw from "./formats.json";
import roundTypesDataRaw from "./round_types.json";

type Event = {
  id: string;
  rank: number;
  format: string;
  name: string;
  can_change_time_limit: boolean;
  can_have_cutoff: boolean;
  is_timed_event: boolean;
  is_fewest_moves: boolean;
  is_multiple_blindfolded: boolean;
  is_official: boolean;
  format_ids: string[];
};
// ----- FORMATS -----

export const formats = {
  byId: _.keyBy(formatsDataRaw, "id"),
};

// ----- EVENTS -----

export const events = {
  official: eventsDataRaw.map(extendEvents).filter((e) => e.is_official),
  byId: _.mapValues(_.keyBy(eventsDataRaw, "id"), extendEvents),
};

export const WCA_EVENT_IDS = Object.values(events.official).map((e) => e.id);

function extendEvents(rawEvent: Event) {
  return {
    ...rawEvent,
    formats: rawEvent.format_ids.map(
      (formatId: string) => formats.byId[formatId],
    ),
    recommendedFormat: formats.byId[rawEvent.format_ids[0]],
  };
}

// ----- ROUND TYPES -----

export const roundTypes = {
  byId: _.keyBy(roundTypesDataRaw, "id"),
};
