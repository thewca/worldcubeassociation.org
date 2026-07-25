import React from 'react';
import I18n from '../../../lib/i18n';
import RegionSelector from '../../../components/wca/RegionSelector';
import EditReasonField from './EditReasonField';

export default function EditRegionField({
  value, reason, isChanged, onValueChange, onReasonChange,
}) {
  return (
    <>
      <RegionSelector
        label={I18n.t('activerecord.attributes.user.country_iso2')}
        name="country_iso2"
        onlyCountries
        region={value}
        onRegionChange={onValueChange}
      />
      <EditReasonField
        name="country_iso2"
        label={I18n.t('activerecord.attributes.user.country_iso2')}
        isChanged={isChanged}
        value={reason}
        onChange={onReasonChange}
      />
    </>
  );
}
