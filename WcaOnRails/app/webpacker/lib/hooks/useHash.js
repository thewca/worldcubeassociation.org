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
      }
    },
    [hash],
  );
  return [hash, setHashFn];
}
