export function getJsonItem(key) {
  const item = localStorage.getItem(key);
  try {
    return JSON.parse(item);
  } catch {
    return null;
  }
}

export function setJsonItem(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}
