import React from 'react';

import { Form } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

export default function DelegateForm({
  formValues,
  updateFormProperty,
  delegateRegions,
  delegateStatusOptions,
}) {
  const handleFormChange = (_, { name, value }) => updateFormProperty({ [name]: value });

  const selectedRegion = React.useMemo(
    () => delegateRegions?.find((region) => region.id === formValues?.regionId),
    [formValues?.regionId, delegateRegions],
  );

  const selectedRegionId = selectedRegion?.parent_group_id || selectedRegion?.id;
  const selectedSubRegionId = selectedRegion?.parent_group_id ? selectedRegion?.id : null;

  const regions = React.useMemo(() => {
    if (!delegateRegions) return [];
    return delegateRegions.filter((region) => !region.parent_group_id).map((region) => ({
      key: region.id,
      text: region.name,
      value: region.id,
    }));
  }, [delegateRegions]);

  const subRegions = React.useMemo(() => {
    if (!delegateRegions) return [];
    return (delegateRegions || [])
      .filter((region) => region.parent_group_id === selectedRegionId)
      .map((region) => ({
        key: region.id,
        text: region.name,
        value: region.id,
      }));
  }, [delegateRegions, selectedRegionId]);

  return (
    <>
      <Form.Dropdown
        label={I18n.t('activerecord.attributes.user.delegate_status')}
        fluid
        selection
        name="delegateStatus"
        value={formValues.delegateStatus}
        options={delegateStatusOptions.map((option) => ({
          text: I18n.t(`enums.user.role_status.delegate_regions.${option}`),
          value: option,
        }))}
        onChange={handleFormChange}
      />
      <Form.Dropdown
        label={I18n.t('activerecord.attributes.user.region')}
        fluid
        selection
        name="regionId"
        value={selectedRegionId}
        options={regions}
        onChange={handleFormChange}
      />
      {subRegions.length > 0 && (
        <Form.Dropdown
          label={I18n.t('activerecord.attributes.user.subRegion')}
          fluid
          selection
          name="regionId"
          value={selectedSubRegionId}
          options={subRegions}
          onChange={handleFormChange}
        />
      )}
      <Form.Input
        label={I18n.t('activerecord.attributes.user.location')}
        name="location"
        value={formValues.location || ''}
        onChange={handleFormChange}
      />
    </>
  );
}
