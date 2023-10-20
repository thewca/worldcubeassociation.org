// Copied from application_helper.rb full_title method.
export default function setTitle(document, title) {
  const siteTitle = 'World Cube Association';
  // eslint-disable-next-line no-param-reassign
  document.title = `${title} | ${siteTitle}`;
}
