import React, { useState } from 'react';
import { Button, Item } from 'semantic-ui-react';
import WcaSearch from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import Loading from '../../../Requests/Loading';
import useQueryParams from '../../../../lib/hooks/useQueryParams';
import EditPersonForm from './EditPersonForm';

export default function EditPersonPage() {
  const [queryParams, updateQueryParam] = useQueryParams();
  const [loading, setLoading] = useState(false);
  const { wcaId } = queryParams;

  if (loading) return <Loading />;

  return (
    <>
      <div>
        To know the difference between fix and update, refer to the Delegate Handbook&apos;s
        &#34;Requesting Changes to Personal Data&#34; section.
      </div>
      {wcaId
        ? (
          <>
            <Item>
              <Item.Content>
                <Item.Header>{`WCA ID: ${wcaId}`}</Item.Header>
                <Item.Description>
                  <Button onClick={() => {
                    setLoading(true);
                    updateQueryParam('wcaId', '');
                  }}
                  >
                    Clear
                  </Button>
                </Item.Description>
              </Item.Content>
            </Item>
            <EditPersonForm wcaId={wcaId} />
          </>
        )
        : (
          <WcaSearch
            onChange={(e, { value }) => {
              setLoading(true);
              updateQueryParam('wcaId', value.id);
            }}
            multiple={false}
            model={SEARCH_MODELS.person}
          />
        )}
    </>
  );
}
