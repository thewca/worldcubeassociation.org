import { fetchWithAuthenticityToken } from '../requests/fetchWithAuthenticityToken';

export default async function renderMarkdownFetch(markdownContent) {
  const request = await fetchWithAuthenticityToken('/render_markdown', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      markdown_content: markdownContent,
    }),
  });
  return request.text();
}
