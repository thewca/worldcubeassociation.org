// eslint-disable-next-line import/prefer-default-export
export function addUserData(
  registrations,
  userInfo,
) {
  return registrations.map((r) => {
    const user = userInfo.find((u) => u.id === r.user_id);
    return user ? { ...r, user } : r;
  });
}
