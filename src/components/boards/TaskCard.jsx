"use client";

import { useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/lib/boards/taskGroups";

const SELECT_CLASS =
  "h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200";

export default function TaskCard({ task, onUpdate, onEdit, onRequestDelete }) {
  const [pending, setPending] = useState(false);
  const [draftStatus, setDraftStatus] = useState(null);
  const [draftPriority, setDraftPriority] = useState(null);

  const statusValue = draftStatus ?? task.status;
  const priorityValue = draftPriority ?? task.priority;

  async function changeStatus(next) {
    setDraftStatus(next);
    setPending(true);
    await onUpdate(task.id, { status: next });
    setPending(false);
    setDraftStatus(null);
  }

  async function changePriority(next) {
    setDraftPriority(next);
    setPending(true);
    await onUpdate(task.id, { priority: next });
    setPending(false);
    setDraftPriority(null);
  }

  const statusId = `task-status-${task.id}`;
  const priorityId = `task-priority-${task.id}`;

  return (
    <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium break-words text-zinc-900 dark:text-zinc-50">
          {task.title}
        </h3>
        <Badge value={priorityValue} />
      </div>

      {task.description ? (
        <p className="mt-1.5 text-xs whitespace-pre-line text-zinc-500 dark:text-zinc-400">
          {task.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor={statusId} className="sr-only">
          Status for {task.title}
        </label>
        <select
          id={statusId}
          value={statusValue}
          onChange={(event) => changeStatus(event.target.value)}
          disabled={pending}
          className={SELECT_CLASS}
        >
          {TASK_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label htmlFor={priorityId} className="sr-only">
          Priority for {task.title}
        </label>
        <select
          id={priorityId}
          value={priorityValue}
          onChange={(event) => changePriority(event.target.value)}
          disabled={pending}
          className={SELECT_CLASS}
        >
          {TASK_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {pending && (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"
          />
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            fullWidth={false}
            disabled={pending}
            onClick={() => onEdit(task)}
          >
            Edit<span className="sr-only"> {task.title}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            fullWidth={false}
            disabled={pending}
            onClick={() => onRequestDelete(task)}
          >
            Delete<span className="sr-only"> {task.title}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
