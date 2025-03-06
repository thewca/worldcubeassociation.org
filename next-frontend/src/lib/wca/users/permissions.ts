import fetchWithWCAToken from "@/lib/wca/fetchWithWCAToken";

export default async function getPermissions(token: string){
  const { data } = await fetchWithWCAToken(token, 'http://localhost:3000/api/v0/users/me/permissions')
  return data;
}
