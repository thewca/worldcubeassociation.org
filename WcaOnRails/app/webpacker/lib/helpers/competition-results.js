/* eslint import/prefer-default-export: "off" */
export function getRecordClass(record) {
  switch (record) {
    case '':
      return '';
    case 'WR': // Intentional fallthrough
    case 'NR':
      return record;
    default:
      return 'CR';
  }
}
