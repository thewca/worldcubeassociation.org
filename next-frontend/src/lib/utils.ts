export const toAvatarName = (fullName?: string) => {
  if (!fullName) return "";
  return fullName
    .replace(/[(（][^)）]*[)）]/g, "") // strip parenthetical segments, e.g. (陳熙哲)
    .replace(/\s+/g, " ")
    .trim();
};
