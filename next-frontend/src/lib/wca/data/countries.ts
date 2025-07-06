import _ from "lodash";
import countriesReal from "../../staticData/countries.real.json";
import countriesFictive from "../../staticData/countries.fictive.json";

const fictionalCountryIds = _.map(countriesFictive, "id");

const countryData = [
  ...countriesReal.states_lists[0].states,
  ...countriesFictive,
];
const realCountryData = countryData.filter(
  (c) => !fictionalCountryIds.includes(c.id),
);

const countries = {
  byIso2: _.keyBy(countryData, "iso2"),
  byId: _.keyBy(countryData, "id"),
  real: realCountryData,
};

export default countries;
