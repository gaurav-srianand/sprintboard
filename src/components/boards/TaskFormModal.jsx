"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  TASK_DESCRIPTION_MAX,
  TASK_TITLE_MAX,
} from "@/lib/boards/validation";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/lib/boards/taskGroups";
import Button from "@/components/ui/Button";
import FormAlert from "@/components/ui/FormAlert";
import Modal from "@/components/ui/Modal";
import SelectField from "@/components/ui/SelectField";
import TextArea from "@/components/ui/TextArea";
import TextField from "@/components/ui/TextField";

export default function TaskFormModal({ task = null, onClose, onSubmit }) {
  const router = useRouter();
  const isEdit = Boolean(task);
  const alertRef = useRef(null);

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState(task?.status || "todo");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  function clientValidation() {
    const errors = {};
    const trimmed = title.trim();

    if (!trimmed) {
      errors.title = "Title is required";
    } else if (trimmed.length > TASK_TITLE_MAX) {
      errors.title = `Title must be at most ${TASK_TITLE_MAX} characters`;
    }

    if (description.length > TASK_DESCRIPTION_MAX) {
      errors.description = `Description must be at most ${TASK_DESCRIPTION_MAX} characters`;
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) {
      return;
    }

    const errors = clientValidation();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }

    setPending(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
    };

    const result = await onSubmit(payload);

    if (result.ok) {
      onClose?.();
      return;
    }

    if (result.error?.kind === "unauthorized") {
      router.replace("/login");
      return;
    }

    setPending(false);
    setError(result.error);
    setFieldErrors(result.error?.fieldErrors || {});
    requestAnimationFrame(() => alertRef.current?.focus());
  }

  return (
    <Modal
      open
      onClose={pending ? undefined : onClose}
      title={isEdit ? "Edit task" : "New task"}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div ref={alertRef} tabIndex={-1} className="outline-none">
          {error && <FormAlert variant="error">{error.message}</FormAlert>}
        </div>

        <TextField
          id="task-title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fieldErrors.title}
          placeholder="What needs to be done?"
          maxLength={TASK_TITLE_MAX}
          disabled={pending}
        />

        <TextArea
          id="task-description"
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={fieldErrors.description}
          placeholder="Add more detail (optional)"
          rows={3}
          maxLength={TASK_DESCRIPTION_MAX}
          disabled={pending}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            id="task-status"
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={TASK_STATUS_OPTIONS}
            disabled={pending}
          />
          <SelectField
            id="task-priority"
            label="Priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            options={TASK_PRIORITY_OPTIONS}
            disabled={pending}
          />
        </div>

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
            type="submit"
            fullWidth={false}
            pending={pending}
            pendingLabel={isEdit ? "Saving…" : "Creating…"}
          >
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
