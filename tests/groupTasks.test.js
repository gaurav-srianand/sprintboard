import test from "node:test";
import assert from "node:assert/strict";

import {
  TASK_COLUMNS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  groupTasksByStatus,
} from "../src/lib/boards/taskGroups.js";

const tasks = [
  { id: "1", status: "todo", title: "A" },
  { id: "2", status: "done", title: "B" },
  { id: "3", status: "todo", title: "C" },
  { id: "4", status: "in_progress", title: "D" },
];

test("exposes the three readable columns in order", () => {
  assert.deepEqual(
    TASK_COLUMNS.map((column) => column.label),
    ["To Do", "In Progress", "Done"]
  );
});

test("groups tasks by status", () => {
  const groups = groupTasksByStatus(tasks);
  assert.deepEqual(
    groups.todo.map((task) => task.id),
    ["1", "3"]
  );
  assert.deepEqual(
    groups.in_progress.map((task) => task.id),
    ["4"]
  );
  assert.deepEqual(
    groups.done.map((task) => task.id),
    ["2"]
  );
});

test("preserves the incoming order within each group", () => {
  const groups = groupTasksByStatus(tasks);
  assert.deepEqual(
    groups.todo.map((task) => task.title),
    ["A", "C"]
  );
});

test("returns empty groups for an empty list", () => {
  const groups = groupTasksByStatus([]);
  assert.deepEqual(groups, { todo: [], in_progress: [], done: [] });
});

test("returns empty groups for a non-array input", () => {
  assert.deepEqual(groupTasksByStatus(null), {
    todo: [],
    in_progress: [],
    done: [],
  });
});

test("ignores tasks with an unknown status", () => {
  const groups = groupTasksByStatus([{ id: "9", status: "archived" }]);
  assert.deepEqual(groups, { todo: [], in_progress: [], done: [] });
});

test("exposes status options matching the columns", () => {
  assert.deepEqual(TASK_STATUS_OPTIONS, [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ]);
});

test("exposes the three priority options with readable labels", () => {
  assert.deepEqual(TASK_PRIORITY_OPTIONS, [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ]);
});
