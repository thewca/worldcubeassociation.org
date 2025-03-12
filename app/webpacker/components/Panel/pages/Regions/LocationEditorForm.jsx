import React, { useMemo } from 'react';
import { Form } from 'semantic-ui-react';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import Errored from '../../../Requests/Errored';
import Loading from '../../../Requests/Loading';
import I18n from '../../../../lib/i18n';

export default function LocationEditorForm({
  groupId, setGroupId, location, setLocation,
}) {
  const { data: delegateRegions, loading, error } = useLoadedData(
    apiV0Urls.userGroups.list(groupTypes.delegate_regions),
  );
  const selectedGroup = useMemo(
    () => delegateRegions?.find((region) => region.id === groupId),
    [delegateRegions, groupId],
  );

  const selectedRegionId = selectedGroup?.parent_group_id || selectedGroup?.id;
  const selectedSubRegionId = selectedGroup?.parent_group_id ? selectedGroup?.id : null;

  const regions = useMemo(() => {
    if (!delegateRegions) return [];
    return delegateRegions.filter((region) => !region.parent_group_id).map((region) => ({
      key: region.id,
      text: region.name,
      value: region.id,
    }));
  }, [delegateRegions]);

  const subRegions = useMemo(() => {
    if (!delegateRegions) return [];
    return (delegateRegions || [])
      .filter((region) => region.parent_group_id === selectedRegionId)
      .map((region) => ({
        key: region.id,
        text: region.name,
        value: region.id,
      }));
  }, [delegateRegions, selectedRegionId]);

  if (loading) return <Loading />;
  if (error) return <Errored />;

  return (
    <Form>
      <Form.Dropdown
        inline
        label={I18n.t('activerecord.attributes.user.region')}
        fluid
        selection
        value={selectedRegionId}
        options={regions}
        onChange={setGroupId}
      />
      {subRegions.length > 0 && (
        <Form.Dropdown
          inline
          label={I18n.t('activerecord.attributes.user.subRegion')}
          fluid
          selection
          value={selectedSubRegionId}
          options={subRegions}
          onChange={setGroupId}
        />
      )}
      <Form.Input
        label="Location"
        value={location}
        onChange={setLocation}
      />
    </Form>
  );
}
