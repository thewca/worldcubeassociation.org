import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AutoNumeric from 'autonumeric';
import { Input } from 'semantic-ui-react';
import { currenciesData } from '../../../lib/wca-data.js.erb';

export default function AutonumericField({ value, onChange, currency }) {
  const [autoNumeric, setAutoNumeric] = useState(null);

  const currencyInfo = useMemo(
    () => (currenciesData.byIso[currency] || currenciesData.byIso.USD),
    [currency],
  );

  const autoNumericCurrency = useMemo(() => ({
    currencySymbol: currencyInfo.symbol,
    currencySymbolPlacement: currencyInfo.symbolFirst ? 'p' : 's',
    decimalPlaces: (currencyInfo.subunitToUnit === 1) ? 0 : 2,
    modifyValueOnWheel: false,
  }), [currencyInfo]);

  const autoNumericRef = useCallback((node) => {
    if (!node?.inputRef) return;

    // Only initialize AutoNumeric once, otherwise some weird glitches can occur
    if (autoNumeric !== null) return;

    const newAutoNumeric = new AutoNumeric(
      node.inputRef.current,
      autoNumericCurrency,
    );

    setAutoNumeric(newAutoNumeric);
  }, [autoNumeric, autoNumericCurrency]);

  // Hook to update AN's _value_
  useEffect(() => {
    if (!autoNumeric) return;

    autoNumeric.set(value / currencyInfo.subunitToUnit);
  }, [autoNumeric, value, currencyInfo]);

  // Hook to update AN's _currency_
  useEffect(() => {
    if (!autoNumeric) return;

    autoNumeric.update(autoNumericCurrency);
  }, [autoNumeric, autoNumericCurrency]);

  const onChangeAutonumeric = (event) => {
    onChange(event, { value: autoNumeric.getNumber() * currencyInfo.subunitToUnit });
  };

  return <Input ref={autoNumericRef} type="text" onChange={onChangeAutonumeric} />;
}
