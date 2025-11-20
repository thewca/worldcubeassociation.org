import _ from "lodash";
import formatsDataRaw from "../../staticData/formats.json";

const formats = {
  byId: _.keyBy(formatsDataRaw, "id"),
};

export default formats;
