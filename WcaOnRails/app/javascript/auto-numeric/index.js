import AutoNumeric from 'autonumeric';
import currenciesData from 'wca/currenciesData.js.erb';

function getCurrencyInfo(isoCode) {
  return currenciesData.byIso[isoCode] || currenciesData.byIso.USD;
};

// Create a mask for an amount input in the given currency, using autoNumeric
// 'action' can be either "init" or "update"
// 'elemId' is a selector for the targeted input field
wca.applyCurrencyMask = function(action, elemId, autoNumericObject, currencyIsoCode) {
  let entry = getCurrencyInfo(currencyIsoCode);
  let currentVal = 0;

  // Get current val
  if (action == "update") {
    currentVal = getValueInCurrency(elemId, autoNumericObject);
  } else if (action == "init") {
    currentVal = $(elemId).val();
  } else {
    throw new Error('Unsupported action for currency mask');
  }

  // Reconfigure
  $.data($(elemId)[0], "current_subunit_to_unit", entry.subunit_to_unit);
  let maskOptions = {
    currencySymbol: entry.symbol,
    currencySymbolPlacement: (entry.symbol_first) ? 'p' : 's',
    // If the currency has no subunit (subunit_to_unit is 1), then we don't need
    // decimals. For currencies with subunits we want to show decimals.
    decimalPlaces: (entry.subunit_to_unit == 1) ? 0 : 2,
    showWarnings: false,
  };
  if (autoNumericObject) {
    autoNumericObject.update(maskOptions);
  } else {
    autoNumericObject = new AutoNumeric(elemId, maskOptions);
  }

  // Set new val
  autoNumericObject.set(currentVal/entry.subunit_to_unit);

  return autoNumericObject;
};

// Retrieve the real value, in the currency's lowest denomination
// Assumes autoNumeric is running on elemId, and the number of subunit_to_unit has been set in data
function getValueInCurrency(elemId, autoNumericObject) {
  let currentVal = autoNumericObject.getNumber();
  let multiplier = $.data($(elemId)[0], "current_subunit_to_unit");
  // Set back the value to the "lowest denomination" in the currency
  return currentVal * multiplier;
};

// Setup the mask for the selected element
wca.setupCurrencyMask = function(elemSelector) {
  let currencyIsoCode = $(elemSelector).data("currency");
  let targetElemId = $(elemSelector).data("target");
  let thisElemId = "#" + $(elemSelector).attr("id");

  let autoNumericObject = wca.applyCurrencyMask('init',
                                            thisElemId,
                                            null,
                                            currencyIsoCode);

  // Populate the actual hidden field on change
  $(thisElemId).change(function() {
    $(targetElemId).val(getValueInCurrency(thisElemId, autoNumericObject));
  });
  return autoNumericObject;
};
