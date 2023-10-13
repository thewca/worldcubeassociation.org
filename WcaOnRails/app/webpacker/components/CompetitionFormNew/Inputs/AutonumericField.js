import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import AutoNumeric from 'autonumeric';
import { Input } from 'semantic-ui-react';
import { currenciesData } from '../../../lib/wca-data.js.erb';

export default function AutonumericField({ value, onChange, currency }) {
  const [autoNumeric, setAutoNumeric] = useState(null);

  const inputComponentRef = useRef();

  const currencyInfo = useMemo(
    () => (currenciesData.byIso[currency] || currenciesData.byIso.USD),
    [currency],
  );

  useEffect(() => {
    const newAutoNumeric = new AutoNumeric(inputComponentRef.current.inputRef.current, {
      currencySymbol: currencyInfo.symbol,
      currencySymbolPlacement: currencyInfo.symbolFirst ? 'p' : 's',
      decimalPlaces: (currencyInfo.subunitToUnit === 1) ? 0 : 2,
      showWarnings: false,
      modifyValueOnWheel: false,
    });

    newAutoNumeric.set(value / currencyInfo.subunitToUnit);

    setAutoNumeric(newAutoNumeric);
  }, [value, currencyInfo]);

  useEffect(() => {
    if (!autoNumeric) return;

    autoNumeric.update({
      currencySymbol: currencyInfo.symbol,
      currencySymbolPlacement: currencyInfo.symbolFirst ? 'p' : 's',
      decimalPlaces: (currencyInfo.subunitToUnit === 1) ? 0 : 2,
    });
  }, [autoNumeric, currencyInfo]);

  const onChangeAutonumeric = (event) => {
    onChange(event, { value: autoNumeric.rawValue * currencyInfo.subunitToUnit });
  };

  return <Input ref={inputComponentRef} type="text" onChange={onChangeAutonumeric} />;
}
