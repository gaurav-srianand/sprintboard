export const TASK_COLUMNS = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

export const TASK_STATUS_OPTIONS = TASK_COLUMNS.map((column) => ({
  value: column.status,
  label: column.label,
}));

export const TASK_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const KNOWN_STATUSES = TASK_COLUMNS.map((column) => column.status);

export function groupTasksByStatus(tasks) {
  const groups = {};

  for (const status of KNOWN_STATUSES) {
    groups[status] = [];
  }

  if (!Array.isArray(tasks)) {
    return groups;
  }

  for (const task of tasks) {
    if (KNOWN_STATUSES.includes(task?.status)) {
      groups[task.status].push(task);
    }
  }

  return groups;
}
