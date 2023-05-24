/* eslint import/prefer-default-export: "off" */
export function getRecordClass(record) {
  if (!record) {
    return '';
  }
  switch (record) {
    case 'WR': // Intentional fallthrough
    case 'NR':
      return record;
    default:
      return 'CR';
  }
}
