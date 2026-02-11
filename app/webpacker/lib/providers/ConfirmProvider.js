// Credit to JonatanKlosko for the original idea
// https://github.com/jonatanklosko/material-ui-confirm

import React, {
  createContext, useCallback, useContext, useState,
} from 'react';
import { Confirm, Modal, Input, Button, Message } from 'semantic-ui-react';

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
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState(false);

  const confirm = useCallback(
    (newOptions = {}) => new Promise((resolve, reject) => {
      setOptions({
        ...DefaultOptions,
        ...newOptions,
      });
      setResolveReject([resolve, reject]);
      setInputValue('');
      setInputError(false);
    }),
    [],
  );

  const [resolve, reject] = resolveReject;

  const handleClose = useCallback(() => {
    setResolveReject([]);
    setInputValue('');
    setInputError(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (reject) {
      reject();
      handleClose();
    }
  }, [reject, handleClose]);

  const handleConfirm = useCallback(() => {
    if (options.requireInput && inputValue !== options.requireInput) {
      setInputError(true);
      return;
    }

    if (resolve) {
      resolve();
      handleClose();
    }
  }, [resolve, handleClose, options.requireInput, inputValue]);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
    setInputError(false);
  }, []);

  const isOpen = resolveReject.length === 2;

  // If requireInput is set, use a custom Modal with input field
  if (options.requireInput) {
    return (
      <>
        <ConfirmationContext.Provider value={confirm}>
          {children}
        </ConfirmationContext.Provider>
        <Modal
          open={isOpen}
          onClose={handleCancel}
          size="small"
        >
          <Modal.Header>Confirm Action</Modal.Header>
          <Modal.Content>
            <p>{options.content}</p>
            <Input
              fluid
              placeholder={`Type "${options.requireInput}" to confirm`}
              value={inputValue}
              onChange={handleInputChange}
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
      </>
    );
  }

  // Default simple confirmation
  return (
    <>
      <ConfirmationContext.Provider value={confirm}>
        {children}
      </ConfirmationContext.Provider>
      <Confirm
        open={isOpen}
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
