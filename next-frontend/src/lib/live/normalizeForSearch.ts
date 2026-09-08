// Lowercases and strips diacritics so that searching "Je" matches "Jérôme".
export const normalizeForSearch = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
