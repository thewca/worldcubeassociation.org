// Credit to JonatanKlosko for the original idea
// https://github.com/jonatanklosko/material-ui-confirm

import React, {
  createContext, useCallback, useContext, useState,
} from 'react';
import { Confirm } from 'semantic-ui-react';

const ConfirmationContext = createContext();

const DefaultOptions = {
  content: 'This action cannot be undone.',
  confirmButton: 'Yes',
  cancelButton: 'No',
};

export default function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(DefaultOptions);
  const [resolveReject, setResolveReject] = useState([]);

  const confirm = useCallback(
    (newOptions = {}) => new Promise((resolve, reject) => {
      setOptions({
        ...DefaultOptions,
        ...newOptions,
      });
      setResolveReject([resolve, reject]);
    }),
    [],
  );

  const [resolve, reject] = resolveReject;

  const handleClose = useCallback(() => {
    setResolveReject([]);
  }, []);

  const handleCancel = useCallback(() => {
    if (reject) {
      reject();
      handleClose();
    }
  }, [reject, handleClose]);

  const handleConfirm = useCallback(() => {
    if (resolve) {
      resolve();
      handleClose();
    }
  }, [resolve, handleClose]);

  return (
    <>
      <ConfirmationContext.Provider value={confirm}>
        {children}
      </ConfirmationContext.Provider>
      <Confirm
        open={resolveReject.length === true}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        content={options.content}
        cancelButton={options.cancelButton}
        confirmButton={options.confirmButton}
      />
    </>
  );
}

export const useConfirm = () => useContext(ConfirmationContext);
