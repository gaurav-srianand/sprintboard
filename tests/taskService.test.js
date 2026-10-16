import test from "node:test";
import assert from "node:assert/strict";

import { createBoard } from "../src/lib/boards/boardService.js";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "../src/lib/boards/taskService.js";
import { createFakeModel, noConnect } from "./helpers/fakeModels.js";

const USER_A = "00000000000000000000000a";
const USER_B = "00000000000000000000000b";

function setup() {
  const Board = createFakeModel();
  const Task = createFakeModel();
  return { deps: { connectDB: noConnect, Board, Task }, Board, Task };
}

async function makeBoard(deps, owner = USER_A) {
  const created = await createBoard(owner, { title: "Board" }, deps);
  return created.data.id;
}

test("createTask stores the session owner/board and applies defaults", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps);

  const result = await createTask(
    USER_A,
    boardId,
    { title: "Do it", owner: USER_B, board: USER_B },
    deps
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, 201);
  assert.equal(result.data.owner, USER_A);
  assert.equal(result.data.board, boardId);
  assert.equal(result.data.status, "todo");
  assert.equal(result.data.priority, "medium");
});

test("createTask accepts explicit status and priority", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps);

  const result = await createTask(
    USER_A,
    boardId,
    { title: "Deploy", status: "in_progress", priority: "high" },
    deps
  );

  assert.equal(result.data.status, "in_progress");
  assert.equal(result.data.priority, "high");
});

test("createTask returns 404 when the board is not owned by the user", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps, USER_A);

  const result = await createTask(USER_B, boardId, { title: "Sneaky" }, deps);

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
  assert.equal(deps.Task.rows.length, 0);
});

test("createTask rejects invalid input", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps);

  const result = await createTask(USER_A, boardId, { title: "" }, deps);

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.ok(result.details.title);
});

test("createTask returns 400 for a malformed board id", async () => {
  const { deps } = setup();
  const result = await createTask(USER_A, "bad-id", { title: "X" }, deps);
  assert.equal(result.status, 400);
});

test("listTasks returns the tasks of an owned board", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps);
  await createTask(USER_A, boardId, { title: "One" }, deps);
  await createTask(USER_A, boardId, { title: "Two" }, deps);

  const result = await listTasks(USER_A, boardId, deps);

  assert.equal(result.ok, true);
  assert.equal(result.data.length, 2);
});

test("listTasks returns 404 for another user's board", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps, USER_A);

  const result = await listTasks(USER_B, boardId, deps);
  assert.equal(result.status, 404);
});

test("getTask returns 404 when the task is not in the given board", async () => {
  const { deps } = setup();
  const boardOne = await makeBoard(deps);
  const boardTwo = await makeBoard(deps);
  const task = await createTask(USER_A, boardOne, { title: "Only here" }, deps);

  const result = await getTask(USER_A, boardTwo, task.data.id, deps);

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
});

test("getTask returns 404 for a cross-user attempt", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps, USER_A);
  const task = await createTask(USER_A, boardId, { title: "Mine" }, deps);

  const result = await getTask(USER_B, boardId, task.data.id, deps);
  assert.equal(result.status, 404);
});

test("updateTask updates only the provided fields", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps);
  const task = await createTask(USER_A, boardId, { title: "Old" }, deps);

  const result = await updateTask(
    USER_A,
    boardId,
    task.data.id,
    { status: "done" },
    deps
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.status, "done");
  assert.equal(result.data.title, "Old");
});

test("updateTask returns 404 for a cross-user attempt", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps, USER_A);
  const task = await createTask(USER_A, boardId, { title: "Mine" }, deps);

  const result = await updateTask(USER_B, boardId, task.data.id, { status: "done" }, deps);

  assert.equal(result.status, 404);
  assert.equal(deps.Task.rows[0].status, "todo");
});

test("deleteTask removes the task for its owner", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps);
  const task = await createTask(USER_A, boardId, { title: "Bye" }, deps);

  const result = await deleteTask(USER_A, boardId, task.data.id, deps);

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(deps.Task.rows.length, 0);
});

test("deleteTask returns 404 for a cross-user attempt and keeps the task", async () => {
  const { deps } = setup();
  const boardId = await makeBoard(deps, USER_A);
  const task = await createTask(USER_A, boardId, { title: "Mine" }, deps);

  const result = await deleteTask(USER_B, boardId, task.data.id, deps);

  assert.equal(result.status, 404);
  assert.equal(deps.Task.rows.length, 1);
});
