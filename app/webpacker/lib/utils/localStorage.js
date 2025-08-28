export function getJsonItem(key) {
  const item = localStorage.getItem(key);
  let parsedItem;
  try {
    parsedItem = JSON.parse(item);
  } catch {
    parsedItem = null;
  }
  return parsedItem;
}

export function setJsonItem(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}
