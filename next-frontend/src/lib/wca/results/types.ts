type SharedFilterState = {
  region: string;
  gender: string;
  show: string;
};

type SharedFilterActions = {
  setRegion: (region: string) => void;
  setGender: (gender: string) => void;
  setShow: (show: string) => void;
};

export type RankingsURLParams = {
  event: string;
  region: string;
  gender: string;
  show: string;
  rankingType: string;
};

export type RecordsFilterBoxProps = {
  filterState: SharedFilterState & { eventIds: string[] };
  filterActions: SharedFilterActions & {
    setSelectedEventIds: (eventIds: string[]) => void;
  };
};

export type RankingsFilterBoxProps = {
  filterState: SharedFilterState & { event: string; rankingType: string };
  filterActions: SharedFilterActions & {
    setEvent: (event: string) => void;
    setType: (type: string) => void;
  };
};

export type RecordsFilterParams = {
  event: string;
  region: string;
  gender: string;
  show: string;
};
