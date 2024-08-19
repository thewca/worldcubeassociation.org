import I18n from '../i18n';
import { groupTypes } from '../wca-data.js.erb';

export function getRoleDescription(role) {
  let roleDescription = '';
  if (role.metadata?.status) {
    roleDescription += `${I18n.t(`enums.user_roles.status.${role.group.group_type}.${role.metadata.status}`)}, `;
  } else if (role.group.group_type === groupTypes.translators) {
    roleDescription += 'Translator, ';
  }
  roleDescription += role.group.name;
  if (role.metadata?.location) {
    roleDescription += ` (${role.metadata.location})`;
  }
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
