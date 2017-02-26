window.wca = window.wca || {};

wca.getCurrencyInfo = function(isoCode) {
  return wca._currenciesInfo[isoCode] || wca._currenciesInfo.USD;
};

// Create a mask for an amount input in the given currency, using autoNumeric
// 'action' can be either "init" or "update"
// 'elemId' is a selector for the targeted input field
wca.applyCurrencyMask = function(action, elemId, currencyIsoCode) {
  var entry = wca.getCurrencyInfo(currencyIsoCode);
  var currentVal = 0;

  // Get current val
  if (action == "update") {
    currentVal = wca.getValueInCurrency(elemId);
  } else if (action == "init") {
    currentVal = $(elemId).val();
  } else {
    throw 'Unsupported action for currency mask';
  }

  // Reconfigure
  $.data($(elemId)[0], "current_subunit_to_unit", entry.subunit_to_unit);
  $(elemId).autoNumeric(action, {
    currencySymbol: entry.symbol,
    currencySymbolPlacement: (entry.symbol_first) ? 'p' : 's',
    // If the currency has no subunit (subunit_to_unit is 1), then we don't need
    // decimals. For currencies with subunits we want to show decimals.
    decimalPlacesOverride: (entry.subunit_to_unit == 1) ? 0 : 2,
    showWarnings: false,
  });

  // Set new val
  $(elemId).autoNumeric('set', currentVal/entry.subunit_to_unit);
};

wca.removeCurrencyMask = function(elemId) {
  $(elemId).autoNumeric('destroy');
};

// Retrieve the real value, in the currency's lowest denomination
// Assumes autoNumeric is running on elemId, and the number of subunit_to_unit has been set in data
wca.getValueInCurrency = function(elemId) {
  var currentVal = $(elemId).autoNumeric('getNumber');
  var multiplier = $.data($(elemId)[0], "current_subunit_to_unit");
  // Set back the value to the "lowest denomination" in the currency
  return currentVal * multiplier;
};

// Setup the mask for the selected elements
$.fn.wcaSetupCurrencyMask = function() {
  this.each(function() {
    if (this.wcaSetupCurrencyMask)
      return;
    this.wcaSetupCurrencyMask = true;

    var currencyIsoCode = $(this).data("currency");
    var targetElemId = $(this).data("target");
    var thisElemId = "#" + $(this).attr("id");

    wca.applyCurrencyMask('init',
        thisElemId,
        currencyIsoCode);

    // Populate the actual hidden field on change
    $(thisElemId).change(function() {
      $(targetElemId).val(wca.getValueInCurrency(thisElemId));
    });
  });
};
