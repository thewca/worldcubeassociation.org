import React, { Fragment, useMemo } from 'react';
import _ from 'lodash';
import { Header, List, ListItem } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import { competitionUrl } from '../../../../lib/requests/routes.js.erb';

const headingPrefixForType = (type) => {
  switch (type) {
    case 'infos': return 'Information for';
    case 'warnings': return 'Warnings detected in';
    case 'errors': return 'Errors detected in';
    default: return `Please contact WST because an unknown type (${type}) was given in`;
  }
};

const subTextForType = (type) => {
  switch (type) {
    case 'warnings': return 'Please pay attention to the warnings below:';
    case 'errors': return 'Please fix the errors below:';
    default: return '';
  }
};

export default function ValidationListView({
  validations, showCompetitionNameOnOutput, type, hasResults,
}) {
  const listByGroup = useMemo(() => _.groupBy(validations, 'kind'), [validations]);

  if (validations.length === 0) {
    if (hasResults) {
      return <p>{`No ${type} detected in the results.`}</p>;
    }
    return <p>No results for the competition yet.</p>;
  }

  return (
    <>
      <p>{subTextForType(type)}</p>
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
          &#91;
          <a href={competitionUrl(validationData.competition_id)}>
            {validationData.competition_id}
          </a>
          &#93;
          {' '}
        </>
      )}
      <>{I18n.t(`validators.${group}.${validationData.id}`, validationData.args)}</>
    </>
  );
}
