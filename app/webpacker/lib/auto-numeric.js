/* Import the bundled library explicitly, otherwise we end up importing transpiled ES6 module. */
import AutoNumeric from 'autonumeric/dist/autoNumeric';
import { currenciesData } from './wca-data.js.erb';

function getCurrencyInfo(isoCode) {
  return currenciesData.byIso[isoCode] || currenciesData.byIso.USD;
}

// Retrieve the real value, in the currency's lowest denomination
// Assumes autoNumeric is running on element, and the number of subunit_to_unit has been set in data
function getValueInCurrency($element) {
  const currentVal = $element.data('autoNumericObject').getNumber();
  const multiplier = $.data($element[0], 'current_subunit_to_unit');
  if ($element.data('autoNumericObject').getNumericString() === '') {
    return null;
  }
  // Set back the value to the "lowest denomination" in the currency
  return currentVal * multiplier;
}

// Create a mask for an amount input in the given currency, using autoNumeric
// 'action' can be either "init" or "update"
// '$element' is a jquery element for the targeted input field
function applyCurrencyMask(action, $element, currencyIsoCode) {
  const entry = getCurrencyInfo(currencyIsoCode);
  let currentVal;

  // Get current val
  if (action === 'update') {
    currentVal = getValueInCurrency($element);
  } else if (action === 'init') {
    currentVal = $element.val();
    if (currentVal === '') {
      currentVal = null;
    }
  } else {
    throw new Error('Unsupported action for currency mask');
  }

  // Reconfigure
  $.data($element[0], 'current_subunit_to_unit', entry.subunitToUnit);
  const maskOptions = {
    currencySymbol: entry.symbol,
    currencySymbolPlacement: entry.symbolFirst ? 'p' : 's',
    // If the currency has no subunit (subunit_to_unit is 1), then we don't need
    // decimals. For currencies with subunits we want to show decimals.
    decimalPlaces: (entry.subunitToUnit === 1) ? 0 : 2,
    showWarnings: false,
    modifyValueOnWheel: false,
  };

  let autoNumericObject = $element.data('autoNumericObject');

  if (autoNumericObject) {
    autoNumericObject.update(maskOptions);
  } else {
    autoNumericObject = new AutoNumeric($element[0], maskOptions);
    $element.data('autoNumericObject', autoNumericObject);
  }

  // Set new val
  autoNumericObject.set(currentVal === null ? null : currentVal / entry.subunitToUnit);
}

// Setup the mask for the selected element
function setupCurrencyMask($element) {
  const currencyIsoCode = $element.data('currency');
  const targetElemId = $element.data('target');

  applyCurrencyMask('init', $element, currencyIsoCode);

  // Populate the actual hidden field on change
  $element.change(() => {
    $(targetElemId).val(getValueInCurrency($element)).trigger('change');
  });
}

$(() => {
  $('.wca-currency-mask').each((index, element) => {
    const $element = $(element);
    const $currencySelector = $($element.data('currencySelector'));

    setupCurrencyMask($element);
    $currencySelector.change(() => {
      applyCurrencyMask('update', $element, $currencySelector.val());
    });
  });
});
