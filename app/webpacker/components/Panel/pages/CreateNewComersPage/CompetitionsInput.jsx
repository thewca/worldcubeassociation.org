import React from 'react';
import {
  Button, Form, Header, HeaderSubheader,
} from 'semantic-ui-react';
import { IdWcaSearch } from '../../../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import { viewUrls } from '../../../../lib/requests/routes.js.erb';
import useQueryParams from '../../../../lib/hooks/useQueryParams';
import useInputState from '../../../../lib/hooks/useInputState';

export default function CompetitionsInput() {
  const [queryParams] = useQueryParams();
  const competitionIdsFromQuery = queryParams?.competition_ids?.split(',');
  const [competitionIds, setCompetitionIds] = useInputState(competitionIdsFromQuery || []);

  return (
    <Form>
      <IdWcaSearch
        model={SEARCH_MODELS.competition}
        multiple
        value={competitionIds}
        onChange={setCompetitionIds}
        label="Competition(s)"
      />
      <Header as="h4">
        <HeaderSubheader>
          Leave blank to check for all competitions
        </HeaderSubheader>
      </Header>
      <Button
        primary
        size="big"
        href={viewUrls.admin.completePersons(competitionIds.length > 0 ? competitionIds : null)}
      >
        Check newcomers
      </Button>
    </Form>
  );
}
