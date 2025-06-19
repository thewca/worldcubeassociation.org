import _ from "lodash";
import continentDataRaw from "../../staticData/continents.json";

const fictionalContinentIds = ["_Multiple Continents"];
const realContinents = continentDataRaw.filter(
  (c) => !fictionalContinentIds.includes(c.id),
);

const continents = {
  byId: _.keyBy(continentDataRaw, "id"),
  real: realContinents,
};

export default continents;
