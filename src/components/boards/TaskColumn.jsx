import TaskCard from "@/components/boards/TaskCard";

export default function TaskColumn({
  status,
  label,
  tasks,
  onUpdate,
  onEdit,
  onRequestDelete,
}) {
  const headingId = `column-${status}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2
          id={headingId}
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {label}
        </h2>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
            No tasks
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={onUpdate}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}
