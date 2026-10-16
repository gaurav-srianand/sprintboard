"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createTask,
  deleteTask,
  getBoard,
  updateTask,
} from "@/lib/api/boardsClient";
import Button from "@/components/ui/Button";
import FormAlert from "@/components/ui/FormAlert";
import ConfirmDialog from "@/components/boards/ConfirmDialog";
import TaskBoard from "@/components/boards/TaskBoard";
import TaskFormModal from "@/components/boards/TaskFormModal";

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex w-fit items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      <span aria-hidden="true">←</span>
      Back to boards
    </Link>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-56 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-80 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          />
        ))}
      </div>
    </div>
  );
}

function DismissibleAlert({ variant, children, onDismiss }) {
  return (
    <FormAlert
      variant={variant}
      className="flex items-start justify-between gap-4"
    >
      <span className="whitespace-pre-line">{children}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-sm font-medium underline underline-offset-4"
      >
        Dismiss
      </button>
    </FormAlert>
  );
}

export default function BoardDetailContent({ boardId }) {
  const router = useRouter();

  const [status, setStatus] = useState("loading");
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  useEffect(() => {
    let active = true;

    async function run() {
      const result = await getBoard(boardId);
      if (!active) {
        return;
      }

      if (result.ok) {
        setBoard(result.data.board);
        setTasks(result.data.tasks || []);
        setStatus("ready");
        return;
      }

      if (result.error.kind === "unauthorized") {
        router.replace("/login");
        return;
      }

      if (
        result.error.kind === "notFound" ||
        result.error.kind === "validation"
      ) {
        setStatus("missing");
        return;
      }

      setError(result.error);
      setStatus("error");
    }

    run();

    return () => {
      active = false;
    };
  }, [boardId, reloadKey, router]);

  function reload() {
    setStatus("loading");
    setError(null);
    setReloadKey((key) => key + 1);
  }

  function openCreate() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  async function submitCreate(payload) {
    const result = await createTask(boardId, payload);

    if (result.ok) {
      setTasks((previous) => [...previous, result.data.task]);
      setNotice(`"${result.data.task.title}" was created.`);
      setActionError(null);
      return { ok: true };
    }

    if (result.error.kind === "unauthorized") {
      router.replace("/login");
      return { ok: false };
    }

    return { ok: false, error: result.error };
  }

  async function submitUpdate(taskId, patch) {
    const result = await updateTask(boardId, taskId, patch);

    if (result.ok) {
      setTasks((previous) =>
        previous.map((task) => (task.id === taskId ? result.data.task : task))
      );
      return { ok: true };
    }

    if (result.error.kind === "unauthorized") {
      router.replace("/login");
      return { ok: false };
    }

    return { ok: false, error: result.error };
  }

  async function handleInlineUpdate(taskId, patch) {
    const result = await submitUpdate(taskId, patch);

    if (result.ok) {
      setActionError(null);
    } else if (result.error) {
      setActionError(result.error.message);
    }

    return result;
  }

  async function submitDelete(taskId) {
    const result = await deleteTask(boardId, taskId);

    if (result.ok) {
      setTasks((previous) => previous.filter((task) => task.id !== taskId));
      setNotice("Task deleted.");
      setActionError(null);
      return { ok: true };
    }

    if (result.error.kind === "unauthorized") {
      router.replace("/login");
      return { ok: false };
    }

    return { ok: false, error: result.error };
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      {status === "loading" && <BoardSkeleton />}

      {status === "missing" && (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Board not found
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            This board does not exist, or it belongs to another account.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Back to boards
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-3">
          <FormAlert variant="error">{error?.message}</FormAlert>
          <div>
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={reload}
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {status === "ready" && board && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {board.title}
              </h1>
              {board.description ? (
                <p className="max-w-3xl text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                  {board.description}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 italic dark:text-zinc-500">
                  No description
                </p>
              )}
            </div>
            <Button type="button" fullWidth={false} onClick={openCreate}>
              New task
            </Button>
          </header>

          {notice && (
            <DismissibleAlert variant="success" onDismiss={() => setNotice(null)}>
              {notice}
            </DismissibleAlert>
          )}

          {actionError && (
            <DismissibleAlert
              variant="error"
              onDismiss={() => setActionError(null)}
            >
              {actionError}
            </DismissibleAlert>
          )}

          {tasks.length === 0 && (
            <FormAlert variant="info">
              This board has no tasks yet. Use “New task” to add one.
            </FormAlert>
          )}

          <TaskBoard
            tasks={tasks}
            onUpdate={handleInlineUpdate}
            onEdit={openEdit}
            onRequestDelete={setDeletingTask}
          />
        </>
      )}

      {formOpen && (
        <TaskFormModal
          task={editingTask}
          onClose={() => setFormOpen(false)}
          onSubmit={(payload) =>
            editingTask
              ? submitUpdate(editingTask.id, payload)
              : submitCreate(payload)
          }
        />
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Delete task"
          message={`Delete “${deletingTask.title}”? This cannot be undone.`}
          confirmLabel="Delete task"
          onClose={() => setDeletingTask(null)}
          onConfirm={() => submitDelete(deletingTask.id)}
        />
      )}
    </div>
  );
}
