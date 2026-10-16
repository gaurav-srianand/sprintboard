const STYLES = {
  todo: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  done: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200",
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
};

const LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function Badge({ value, className = "" }) {
  const label = LABELS[value] || value;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        STYLES[value] || STYLES.todo
      } ${className}`}
    >
      {label}
    </span>
  );
}
