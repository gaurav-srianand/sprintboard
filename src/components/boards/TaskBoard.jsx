import TaskColumn from "@/components/boards/TaskColumn";
import {
  TASK_COLUMNS,
  groupTasksByStatus,
} from "@/lib/boards/taskGroups";

export default function TaskBoard({ tasks, onUpdate, onEdit, onRequestDelete }) {
  const groups = groupTasksByStatus(tasks);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {TASK_COLUMNS.map((column) => (
        <TaskColumn
          key={column.status}
          status={column.status}
          label={column.label}
          tasks={groups[column.status]}
          onUpdate={onUpdate}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </div>
  );
}
