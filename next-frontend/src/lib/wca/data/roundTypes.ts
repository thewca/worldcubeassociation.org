import _ from "lodash";
import roundTypesDataRaw from "../../staticData/round_types.json";

// ----- ROUND TYPES -----

const roundTypes = {
  byId: _.keyBy(roundTypesDataRaw, "id"),
};

export default roundTypes;
