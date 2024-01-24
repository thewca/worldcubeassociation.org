import React from 'react';
import { Popup } from 'semantic-ui-react';
import useLoadedData from '../../lib/hooks/useLoadedData';
import I18n from '../../lib/i18n';
import { apiV0Urls, delegatesPageUrl, teamsCommitteesPageUrl } from '../../lib/requests/routes.js.erb';
import { groupTypes } from '../../lib/wca-data.js.erb';

// let i18n-tasks know the key is used
// i18n-tasks-use t('user_groups.group_types.board')
// i18n-tasks-use t('user_groups.group_types.officers')

function badgeParams(role) {
  if (role.group.group_type === groupTypes.delegate_regions) {
    return {
      roleTitle: I18n.t(`enums.user.role_status.${role.group.group_type}.${role.metadata.status}`),
      groupTitle: I18n.t(`enums.user.role_status.${role.group.group_type}.${role.metadata.status}`),
      badgeClass: 'delegate-badge',
      url: delegatesPageUrl,
    };
  }
  if ([groupTypes.teams_committees, groupTypes.councils].includes(role.group.group_type)) {
    return {
      roleTitle: `${role.group.metadata.friendly_id.toUpperCase()} ${I18n.t(`enums.user.role_status.${role.group.group_type}.${role.metadata.status}`)}`,
      groupTitle: role.group.name,
      badgeClass: `team-${role.metadata.status.replace('_', '-')}-badge`,
      url: teamsCommitteesPageUrl,
    };
  }
  if (role.group.group_type === groupTypes.board) {
    return {
      roleTitle: role.group.metadata.friendly_id.toUpperCase(),
      groupTitle: I18n.t(`user_groups.group_types.${role.group.group_type}`),
      badgeClass: 'team-member-badge',
      url: teamsCommitteesPageUrl,
    };
  }
  if (role.group.group_type === groupTypes.officers) {
    return {
      roleTitle: `${I18n.t(`about.structure.${role.metadata.status}.name`)}`,
      groupTitle: I18n.t(`user_groups.group_types.${role.group.group_type}`),
      badgeClass: 'officer-badge',
      url: teamsCommitteesPageUrl,
    };
  }
  return {};
}

export default function Badges({ userId }) {
  const { data } = useLoadedData(apiV0Urls.userRoles.listOfUser(
    userId,
    ['lead', 'eligibleVoter', 'groupTypeRank', 'status', 'groupName'].join(','), // Sort params
    {
      isActive: true,
      isGroupHidden: false,
    },
  ));
  const roles = data || [];

  return (
    <div className="positions-container">
      {
        roles.map((role) => {
          const {
            roleTitle, groupTitle, badgeClass, url,
          } = badgeParams(role);
          return (
            <Popup
              content={groupTitle}
              position="bottom center"
              inverted
              trigger={(
                <span className={`badge ${badgeClass}`}>
                  <a href={url}>{roleTitle}</a>
                </span>
            )}
            />
          );
        })
      }
    </div>
  );
}
