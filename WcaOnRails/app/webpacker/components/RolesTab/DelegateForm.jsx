import React from 'react';

import { Form } from 'semantic-ui-react';
import I18n from '../../lib/i18n';

export default function DelegateForm({
  formValues,
  updateFormProperty,
  regions,
  subRegions,
  delegateStatusOptions,
}) {
  const handleFormChange = (_, { name, value }) => updateFormProperty({ [name]: value });

  const subRegionsOfSelectedRegion = React.useMemo(() => {
    if (!formValues.regionId) return [];
    const subRegionsList = subRegions[formValues.regionId] || [];
    if (subRegionsList.length > 0) {
      return [...subRegionsList, {
        name: 'None',
        value: null,
      }];
    }
    return subRegionsList;
  }, [formValues.regionId, subRegions]);

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
        value={formValues.regionId || ''}
        options={regions.map((region) => ({
          key: region.id,
          text: region.name,
          value: region.id,
        }))}
        onChange={handleFormChange}
      />
      {subRegionsOfSelectedRegion.length > 0 && (
        <Form.Dropdown
          label={I18n.t('activerecord.attributes.user.subRegion')}
          fluid
          selection
          name="subRegionId"
          value={formValues.subRegionId || ''}
          options={subRegionsOfSelectedRegion.map((subRegion) => ({
            key: subRegion.id,
            text: subRegion.name,
            value: subRegion.id,
          }))}
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
