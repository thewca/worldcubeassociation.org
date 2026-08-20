// Credit to JonatanKlosko for the original idea
// https://github.com/jonatanklosko/material-ui-confirm

import React, {
  createContext, useCallback, useContext, useState, useMemo,
} from 'react';
import {
  Confirm, Modal, Input, Button, Message,
} from 'semantic-ui-react';
import useInputState from '../hooks/useInputState';

const ConfirmationContext = createContext();

const DefaultOptions = {
  content: 'Are you sure? This action cannot be undone.',
  confirmButton: 'Yes',
  cancelButton: 'No',
  requireInput: null, // If set, user must type this exact string to confirm
};

export default function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(DefaultOptions);
  const [resolveReject, setResolveReject] = useState([]);
  const [inputValue, setInputValue] = useInputState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const inputError = useMemo(
    () => submitAttempted && options.requireInput && inputValue !== options.requireInput,
    [submitAttempted, options.requireInput, inputValue],
  );

  const confirm = useCallback(
    (newOptions = {}) => new Promise((resolve, reject) => {
      setOptions({
        ...DefaultOptions,
        ...newOptions,
      });
      setResolveReject([resolve, reject]);
      setInputValue('');
      setSubmitAttempted(false);
    }),
    [setInputValue],
  );

  const [resolve, reject] = resolveReject;

  const handleClose = useCallback(() => {
    setResolveReject([]);
    setInputValue('');
    setSubmitAttempted(false);
  }, [setInputValue]);

  const handleCancel = useCallback(() => {
    if (reject) {
      reject();
      handleClose();
    }
  }, [reject, handleClose]);

  const handleConfirm = useCallback(() => {
    if (options.requireInput && inputValue !== options.requireInput) {
      setSubmitAttempted(true);
      return;
    }

    if (resolve) {
      resolve();
      handleClose();
    }
  }, [resolve, handleClose, options.requireInput, inputValue]);

  const isOpen = resolveReject.length === 2;

  return (
    <>
      <ConfirmationContext.Provider value={confirm}>
        {children}
      </ConfirmationContext.Provider>
      {options.requireInput ? (
        <Modal
          open={isOpen}
          onClose={handleCancel}
          size="small"
        >
          <Modal.Header>Confirm Action</Modal.Header>
          <Modal.Content>
            <p>{options.content}</p>
            <p>
              Type
              {' '}
              <code>{options.requireInput}</code>
              {' '}
              to confirm
            </p>
            <Input
              fluid
              placeholder={options.requireInput}
              value={inputValue}
              onChange={setInputValue}
              // Disable pasting to force user to type the exact string
              onPaste={(e) => e.preventDefault()}
              error={inputError}
              autoFocus
            />
            {inputError && (
              <Message negative style={{ marginTop: '10px' }}>
                Input does not match. Please try again.
              </Message>
            )}
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={handleCancel}>
              {options.cancelButton}
            </Button>
            <Button
              negative
              onClick={handleConfirm}
              disabled={!inputValue}
            >
              {options.confirmButton}
            </Button>
          </Modal.Actions>
        </Modal>
      ) : (
        <Confirm
          open={isOpen}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          content={options.content}
          cancelButton={options.cancelButton}
          confirmButton={options.confirmButton}
        />
      )}
    </>
  );
}

export const useConfirm = () => useContext(ConfirmationContext);
