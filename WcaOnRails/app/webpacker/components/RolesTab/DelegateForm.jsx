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
    let subregionsList = [];
    if (!formValues.regionId) return [];
    subregionsList = subRegions[formValues.regionId] || [];
    if (subregionsList.length > 0) {
      subregionsList.push({
        name: 'None',
        value: null,
      });
    }
    return subregionsList;
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
          label={I18n.t('activerecord.attributes.user.subregion')}
          fluid
          selection
          name="subregionId"
          value={formValues.subregionId || ''}
          options={subRegionsOfSelectedRegion.map((subregion) => ({
            key: subregion.id,
            text: subregion.name,
            value: subregion.id,
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
