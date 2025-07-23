import _ from "lodash";
import roundTypesDataRaw from "../../staticData/round_types.json";

const roundTypes = {
  byId: _.keyBy(roundTypesDataRaw, "id"),
};

export default roundTypes;
