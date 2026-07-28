import React, { useState, useEffect } from 'react';
import {
  Icon, Form, Grid, Popup,
} from 'semantic-ui-react';

import RegionSelector from '../../wca/RegionSelector';
import { personApiUrl } from '../../../lib/requests/routes.js.erb';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import useNestedInputUpdater from '../../../lib/hooks/useNestedInputUpdater';
import I18n from '../../../lib/i18n';

function PersonForm({ personData, setPersonData }) {
  const { wcaId, name, countryIso2 } = personData;
  const [wcaIdError, setWcaIdError] = useState(null);

  // Clear any person data request error upon WCA ID change.
  useEffect(() => setWcaIdError(null), [wcaId]);

  const setWcaId = useNestedInputUpdater(setPersonData, 'wcaId');
  const setName = useNestedInputUpdater(setPersonData, 'name');
  const setCountryIso2 = useNestedInputUpdater(setPersonData, 'countryIso2');

  // Create a function to get person data from the API.
  const fetchDataForWcaId = (id) => {
    setWcaIdError(null);
    fetchJsonOrError(personApiUrl(id)).then(({ data }) => {
      const { person } = data;
      setPersonData({
        wcaId: person.wca_id,
        name: person.name,
        countryIso2: person.country_iso2,
      });
    }).catch((err) => setWcaIdError(err.message));
  };

  return (
    <Form>
      <Grid stackable padded columns={3}>
        <Grid.Column>
          <Form.Input
            label="WCA ID"
            onChange={setWcaId}
            error={wcaIdError}
            value={wcaId}
            icon={(
              <Popup
                trigger={(
                  <Icon
                    circular
                    link
                    onClick={() => fetchDataForWcaId(wcaId)}
                    name="sync"
                  />
                )}
                content="Get the person data for that WCA ID and fill the form"
                position="top right"
              />
          )}
          />
        </Grid.Column>
        <Grid.Column>
          <Form.Input
            label="Name"
            onChange={setName}
            value={name}
          />
        </Grid.Column>
        <Grid.Column>
          <RegionSelector
            label={I18n.t('activerecord.attributes.user.country_iso2')}
            onlyCountries
            region={countryIso2}
            onRegionChange={setCountryIso2}
          />
        </Grid.Column>
      </Grid>
    </Form>
  );
}

export default PersonForm;
