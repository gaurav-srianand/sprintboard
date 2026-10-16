"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import FormAlert from "@/components/ui/FormAlert";
import Modal from "@/components/ui/Modal";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  pendingLabel = "Deleting…",
  onConfirm,
  onClose,
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm() {
    if (pending) {
      return;
    }

    setPending(true);
    setError(null);

    const result = await onConfirm();

    if (result?.ok) {
      onClose?.();
      return;
    }

    setPending(false);
    if (result?.error) {
      setError(result.error.message);
    }
  }

  return (
    <Modal
      open
      onClose={pending ? undefined : onClose}
      title={title}
    >
      <div className="flex flex-col gap-4">
        {error && <FormAlert variant="error">{error}</FormAlert>}

        <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            fullWidth={false}
            pending={pending}
            pendingLabel={pendingLabel}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
