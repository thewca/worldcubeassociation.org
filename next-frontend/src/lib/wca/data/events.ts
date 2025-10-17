import _ from "lodash";
import eventsDataRaw from "../../staticData/events.json";
import formats from "@/lib/wca/data/formats";

type Event = (typeof eventsDataRaw)[number];
export type EventId = Event["id"];

const events = {
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

export default events;
