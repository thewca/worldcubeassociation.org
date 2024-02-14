import I18n from '../i18n';

export function getRoleDescription(role) {
  let roleDescription = '';
  if (role.metadata.status) {
    roleDescription += `${I18n.t(`enums.user.role_status.${role.group.group_type}.${role.metadata.status}`)}, `;
  }
  roleDescription += role.group.name;
  return roleDescription;
}

export function getRoleSubDescription(role) {
  if (role.start_date) {
    if (role.end_date) {
      return `${role.start_date} - ${role.end_date}`;
    }
    return `Since ${role.start_date}`;
  }
  return '';
}
