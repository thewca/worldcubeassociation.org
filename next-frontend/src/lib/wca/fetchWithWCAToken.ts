export default async function fetchWithWCAToken (token: string, url: string, fetchOptions = {}){
  const options = fetchOptions;
  if (!options.headers) {
    options.headers = {};
  }
  options.headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, options);
  const json = await response.json();

  return { data: json };
}
