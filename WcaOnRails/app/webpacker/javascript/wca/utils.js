export const formattedTextForDate = (utcTime, locale) => {
  const date = new Date(utcTime);
  let formatted;
  if (typeof (Intl) !== 'undefined') {
    formatted = new Intl.DateTimeFormat(locale, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', timeZoneName: 'short',
    }).format(date);
  } else {
    // Workaround for https://github.com/thewca/worldcubeassociation.org/issues/3228.
    // We can remove this once we consider Safari 9 to be "dead enough".
    formatted = date.toString();
  }
  return formatted;
};

export const getUrlParams = () => {
  /* eslint-disable-next-line */
  const query = location.search.substr(1);
  const result = {};
  if (query) {
    query.split('&').forEach((part) => {
      const [key, val] = decodeURIComponent(part).split('=');
      result[key] = val;
    });
  }
  return result;
};

export const setUrlParams = (params) => {
  const allParams = {
    ...getUrlParams(),
    ...params,
  };
  const paramsAsStr = Object.keys(allParams).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&');
  /* eslint-disable-next-line */
  history.replaceState(null, null, `?${paramsAsStr}`);
};
