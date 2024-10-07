import React, { useCallback, useMemo } from 'react';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DateTime } from 'luxon';

const loadAsPseudoLocal = (isoString) => {
  if (!isoString) { return false; }

  // all of our WCIF-contained dates are defined to be UTC
  // eslint-disable-next-line implicit-arrow-linebreak
  return DateTime.fromISO(isoString, { zone: 'UTC' })
    // but the react-datepicker uses local TZ,
    // so we have to make the date _think_ it's local without actually converting the time
    .setZone('local', { keepLocalTime: true })
    // and finally output as JS-compatible object
    .toJSDate();
};

const useIsoDate = (isoString) => useMemo(() => loadAsPseudoLocal(isoString), [isoString]);

function UtcDatePicker({
  id,
  name,
  isoDate,
  onChange,
  shouldCloseOnSelect,
  showTimeInput = false,
  showYearDropdown = false,
  dropdownMode = null,
  scrollableYearDropdown = false,
  showIcon = false,
  placeholderText = null,
  selectsStart = false,
  selectsEnd = false,
  isoStartDate = null,
  isoEndDate = null,
  isoMinDate = null,
  isoMaxDate = null,
  dateFormatOverride = null,
  timeFormatOverride = null,
}) {
  const date = useIsoDate(isoDate);

  const onChangeInternal = useCallback((newDate) => {
    const luxon = DateTime.fromJSDate(newDate)
      // convert to UTC while still maintaining the exact time that the user put in
      .setZone('UTC', { keepLocalTime: true });

    const wcifStringValue = showTimeInput
      ? luxon.toISO({ suppressMilliseconds: true })
      : luxon.toISODate();

    onChange(wcifStringValue);
  }, [onChange, showTimeInput]);

  const startDate = useIsoDate(isoStartDate);
  const endDate = useIsoDate(isoEndDate);
  const minDate = useIsoDate(isoMinDate);
  const maxDate = useIsoDate(isoMaxDate);

  const timeFormat = timeFormatOverride || 'p';

  // weird quirk in the 3rd party datepicker implementation: The "dateFormat" field actually means
  //  "format for the whole input row, which may or may not include time". The field "timeFormat"
  //  is only considered for time-specific inputs *within* the dropdown parts of the picker.
  const dateOnlyFormat = dateFormatOverride || 'P';
  const dateFormat = showTimeInput ? (dateOnlyFormat + timeFormat) : dateOnlyFormat;

  return (
    <DatePicker
      id={id}
      name={name}
      selected={date}
      onChange={onChangeInternal}
      shouldCloseOnSelect={shouldCloseOnSelect}
      showTimeInput={showTimeInput}
      showYearDropdown={showYearDropdown}
      dropdownMode={dropdownMode}
      scrollableYearDropdown={scrollableYearDropdown}
      timeInputLabel="UTC"
      dateFormat={dateFormat}
      timeFormat={timeFormat}
      showIcon={showIcon}
      placeholderText={placeholderText}
      selectsStart={selectsStart}
      selectsEnd={selectsEnd}
      startDate={startDate}
      endDate={endDate}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}

export default UtcDatePicker;
