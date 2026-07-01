import _ from "lodash";
import formatsDataRaw from "../../staticData/formats.json";

export type Format = (typeof formatsDataRaw)[number];

const formats = {
  byId: _.keyBy(formatsDataRaw, "id"),
};

export default formats;
