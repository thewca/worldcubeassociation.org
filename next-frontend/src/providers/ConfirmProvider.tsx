"use client";

// Credit to JonatanKlosko for the original idea
// https://github.com/jonatanklosko/material-ui-confirm

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Input,
  Portal,
  Text,
} from "@chakra-ui/react";

interface ConfirmOptions {
  content?: ReactNode;
  confirmButton?: string;
  cancelButton?: string;
  requireInput?: string | null;
}

const DEFAULT_OPTIONS: Required<ConfirmOptions> = {
  content: <Text>Are you sure? This action cannot be undone.</Text>,
  confirmButton: "Yes",
  cancelButton: "No",
  requireInput: null,
};

type voidFunction = () => void;

type ConfirmFn = (options?: ConfirmOptions) => Promise<void>;

const ConfirmationContext = createContext<ConfirmFn | null>(null);

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  onCancel: voidFunction;
  onConfirm: voidFunction;
  cancelButton: ReactNode;
  confirmButton: ReactNode;
  confirmDisabled?: boolean;
  children: ReactNode;
  size?: Dialog.RootProps["size"];
  lazyMount?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  onCancel,
  onConfirm,
  cancelButton,
  confirmButton,
  confirmDisabled = false,
  children,
  size,
  lazyMount = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={({ open: stillOpen }) => !stillOpen && onCancel()}
      size={size}
      lazyMount={lazyMount}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onCancel}>
                {cancelButton}
              </Button>
              <Button
                colorPalette="red"
                onClick={onConfirm}
                disabled={confirmDisabled}
              >
                {confirmButton}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] =
    useState<Required<ConfirmOptions>>(DEFAULT_OPTIONS);
  const [resolveReject, setResolveReject] = useState<
    [voidFunction, voidFunction] | []
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const inputError = useMemo(
    () =>
      submitAttempted &&
      !!options.requireInput &&
      inputValue !== options.requireInput,
    [submitAttempted, options.requireInput, inputValue],
  );

  const confirm = useCallback(
    (newOptions: ConfirmOptions = {}) =>
      new Promise<void>((resolve, reject) => {
        setOptions({ ...DEFAULT_OPTIONS, ...newOptions });
        setResolveReject([resolve, reject]);
        setInputValue("");
        setSubmitAttempted(false);
      }),
    [],
  );

  const [resolve, reject] = resolveReject;

  const handleClose = useCallback(() => {
    setResolveReject([]);
    setInputValue("");
    setSubmitAttempted(false);
  }, []);

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
      <ConfirmDialog
        open={isOpen}
        title="Confirm Action"
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        cancelButton={options.cancelButton}
        confirmButton={options.confirmButton}
        confirmDisabled={!!options.requireInput && !inputValue}
      >
        {options.content}
        {options.requireInput && (
          <Field.Root invalid={inputError} mt={3}>
            <Text mb={1}>
              Type <code>{options.requireInput}</code> to confirm
            </Text>
            <Input
              placeholder={options.requireInput}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              // Disable pasting to force the user to type the exact string
              onPaste={(e) => e.preventDefault()}
              autoFocus
            />
            <Field.ErrorText>
              Input does not match. Please try again.
            </Field.ErrorText>
          </Field.Root>
        )}
      </ConfirmDialog>
    </>
  );
}

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
