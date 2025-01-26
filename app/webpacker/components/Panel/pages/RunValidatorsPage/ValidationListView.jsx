import React, { Fragment, useMemo } from 'react';
import _ from 'lodash';
import { Header, List, ListItem } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import { competitionUrl } from '../../../../lib/requests/routes.js.erb';

const headingPrefixForType = (type) => {
  switch (type) {
    case 'info': return 'Information for';
    case 'warning': return 'Warnings detected in';
    case 'error': return 'Errors detected in';
    default: return 'Unknown detected in';
  }
};

export default function ValidationListView({ validations, showCompetitionNameOnOutput, type }) {
  const listByGroup = useMemo(() => _.groupBy(validations, 'kind'), [validations]);

  return (
    <>
      {Object.entries(listByGroup).map(([group, list]) => (
        <Fragment key={group}>
          <Header as="h5">{`${headingPrefixForType(type)} ${group}`}</Header>
          <List bulleted>
            {list.map((validationData) => (
              <ListItem key={validationData.id}>
                <ValidationText
                  validationData={validationData}
                  group={group}
                  showCompetitionNameOnOutput={showCompetitionNameOnOutput}
                />
              </ListItem>
            ))}
          </List>
        </Fragment>
      ))}
    </>
  );
}

function ValidationText({ validationData, group, showCompetitionNameOnOutput }) {
  return (
    <>
      {showCompetitionNameOnOutput && (
        <>
          [
          <a href={competitionUrl(validationData.competition_id)}>
            {validationData.competition_id}
          </a>
          {'] '}
        </>
      )}
      <>{I18n.t(`validators.${group}.${validationData.id}`, validationData.args)}</>
    </>
  );
}
