"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { deleteBoard, listBoards } from "@/lib/api/boardsClient";
import Button from "@/components/ui/Button";
import FormAlert from "@/components/ui/FormAlert";
import BoardCard from "@/components/boards/BoardCard";
import BoardFormModal from "@/components/boards/BoardFormModal";
import ConfirmDialog from "@/components/boards/ConfirmDialog";

function BoardSkeleton() {
  return (
    <div className="h-36 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="p-5">
        <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-3 h-3 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="mt-2 h-3 w-4/5 rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>
    </div>
  );
}

export default function BoardsView({ userName }) {
  const router = useRouter();

  const [status, setStatus] = useState("loading");
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [deletingBoard, setDeletingBoard] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function run() {
      const result = await listBoards();
      if (!active) {
        return;
      }

      if (result.ok) {
        setBoards(result.data.boards || []);
        setError(null);
        setStatus("ready");
        return;
      }

      if (result.error.kind === "unauthorized") {
        router.replace("/login");
        return;
      }

      setError(result.error);
      setStatus("error");
    }

    run();

    return () => {
      active = false;
    };
  }, [reloadKey, router]);

  function reload() {
    setStatus("loading");
    setError(null);
    setReloadKey((key) => key + 1);
  }

  function openCreate() {
    setEditingBoard(null);
    setFormOpen(true);
  }

  function openEdit(board) {
    setEditingBoard(board);
    setFormOpen(true);
  }

  function handleSaved(board, { isEdit }) {
    if (isEdit) {
      setBoards((previous) =>
        previous.map((item) => (item.id === board.id ? board : item))
      );
      setNotice(`"${board.title}" was updated.`);
    } else {
      setBoards((previous) => [board, ...previous]);
      setNotice(`"${board.title}" was created.`);
    }
  }

  async function submitDelete(boardId) {
    const result = await deleteBoard(boardId);

    if (result.ok) {
      setBoards((previous) => previous.filter((item) => item.id !== boardId));
      setNotice("Board deleted.");
      return { ok: true };
    }

    if (result.error.kind === "unauthorized") {
      router.replace("/login");
      return { ok: false };
    }

    if (result.error.kind === "notFound") {
      setBoards((previous) => previous.filter((item) => item.id !== boardId));
      setNotice("That board no longer exists, so it was removed from your list.");
      return { ok: true };
    }

    return { ok: false, error: result.error };
  }

  const isEmpty = status === "ready" && boards.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Your boards
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {userName ? `Welcome back, ${userName}. ` : ""}
            Organize your work into boards and track tasks.
          </p>
        </div>
        <Button type="button" fullWidth={false} onClick={openCreate}>
          New board
        </Button>
      </div>

      {notice && (
        <FormAlert
          variant="success"
          className="flex items-start justify-between gap-4"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="shrink-0 text-sm font-medium underline underline-offset-4"
          >
            Dismiss
          </button>
        </FormAlert>
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

      {status === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BoardSkeleton />
          <BoardSkeleton />
          <BoardSkeleton />
        </div>
      )}

      {status === "ready" && boards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onEdit={openEdit}
              onDelete={setDeletingBoard}
            />
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
            No boards yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Create your first board to start planning a sprint and tracking
            tasks.
          </p>
          <div className="mt-5 flex justify-center">
            <Button type="button" fullWidth={false} onClick={openCreate}>
              Create your first board
            </Button>
          </div>
        </div>
      )}

      {formOpen && (
        <BoardFormModal
          board={editingBoard}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {deletingBoard && (
        <ConfirmDialog
          title="Delete board"
          message={`Delete "${deletingBoard.title}"? This will also permanently delete all of its tasks. This cannot be undone.`}
          confirmLabel="Delete board"
          onClose={() => setDeletingBoard(null)}
          onConfirm={() => submitDelete(deletingBoard.id)}
        />
      )}
    </div>
  );
}
