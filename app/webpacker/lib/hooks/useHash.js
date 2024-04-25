// Copied from https://github.com/streamich/react-use/blob/master/src/useHash.ts.

import React from 'react';

function getHashFromBrowserUrl() {
  const urlHash = window.location.hash;
  if (urlHash.length > 0) {
    if (urlHash[0] === '#') {
      return urlHash.slice(1);
    }
    return urlHash;
  }
  return null;
}

export default function useHash() {
  const [hash, setHash] = React.useState(getHashFromBrowserUrl());

  const onHashChange = React.useCallback(() => {
    setHash(getHashFromBrowserUrl());
  }, []);

  React.useEffect(() => {
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [onHashChange]);

  const setHashFn = React.useCallback(
    (newHash) => {
      if (newHash !== hash) {
        window.location.hash = newHash;
        // The next line may not be actually required. This will anyway get called inside
        // onHashChange because onHashChange is the listener to browser hash change. But sometimes
        // the above line gets called before the listener is added (especially when network speed
        // is less), and in that case it will skip calling setHash and hence leading to unexpected
        // behavior in UI. Calling this here will make sure to get that called irrespective of
        // whether listener is added or not and this won't have any negative impact on UI as well.
        setHash(getHashFromBrowserUrl());
      }
    },
    [hash],
  );
  return [hash, setHashFn];
}
