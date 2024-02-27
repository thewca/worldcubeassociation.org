import { useState, useCallback } from 'react';
import { fetchJsonOrError } from '../requests/fetchWithAuthenticityToken';

const throwError = (err) => { throw err; };

// This is a hook that can be used to save some data to the website (as json)
// It assumes that 'url' is a valid, PATCH-able, url; the method can be changed
// through the options.
// Example of usage:
// const { save, saving } = useSaveAction();
// // and then:
// save(modelUrl(), { /* model attrs */ }, () => console.log("success"));
// // you may also want to override some options:
// save(modelUrl(), {}, () => console.log("deleted"), { method: 'DELETE' });
const useSaveAction = () => {
  const [saving, setSaving] = useState(false);

  const save = useCallback((url, data, onSuccess, options = {}, onError = throwError) => {
    setSaving(true);
    fetchJsonOrError(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    }).then((response) => onSuccess(response.data)).catch(onError).finally(() => setSaving(false));
  }, [setSaving]);

  return {
    saving,
    save,
  };
};

export default useSaveAction;
