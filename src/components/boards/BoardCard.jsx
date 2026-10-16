import Link from "next/link";

import Button from "@/components/ui/Button";

export default function BoardCard({ board, onEdit, onDelete }) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
      <h2 className="line-clamp-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        <Link
          href={`/dashboard/boards/${board.id}`}
          className="after:absolute after:inset-0 after:content-[''] group-hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          {board.title}
        </Link>
      </h2>

      <p className="mt-1 line-clamp-2 flex-1 text-sm text-zinc-500 dark:text-zinc-400">
        {board.description || "No description"}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span
          aria-hidden="true"
          className="text-xs font-medium text-zinc-400 dark:text-zinc-500"
        >
          Open board →
        </span>
        <div className="relative z-10 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            fullWidth={false}
            onClick={() => onEdit(board)}
          >
            Edit<span className="sr-only"> {board.title}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            fullWidth={false}
            onClick={() => onDelete(board)}
          >
            Delete<span className="sr-only"> {board.title}</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
