type SharedFilterState = {
  region: string;
  gender: string;
};

type SharedFilterActions = {
  setRegion: (region: string) => void;
  setGender: (gender: string) => void;
};

export type RecordsFilters = SharedFilterState & {
  eventIds: string[];
  view: "current" | "history";
  groupBy: "event" | "type";
};

export type RankingsFilters = {
  event: string;
  region: string;
  gender: string;
  show: string;
  rankingType: string;
};

export type RecordsFilterBoxProps = {
  filterState: RecordsFilters;
  filterActions: SharedFilterActions & {
    setSelectedEventIds: (eventIds: string[]) => void;
    setGroupBy: (groupBy: RecordsFilters["groupBy"]) => void;
  };
};

export type RankingsFilterBoxProps = {
  filterState: SharedFilterState & {
    event: string;
    rankingType: string;
    show: string;
  };
  filterActions: SharedFilterActions & {
    setEvent: (event: string) => void;
    setType: (type: string) => void;
  };
};
