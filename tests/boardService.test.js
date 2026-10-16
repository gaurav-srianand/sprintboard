import test from "node:test";
import assert from "node:assert/strict";

import {
  createBoard,
  deleteBoard,
  getBoardWithTasks,
  listBoards,
  updateBoard,
} from "../src/lib/boards/boardService.js";
import { createFakeModel, noConnect } from "./helpers/fakeModels.js";

const USER_A = "00000000000000000000000a";
const USER_B = "00000000000000000000000b";

function setup() {
  const Board = createFakeModel();
  const Task = createFakeModel();
  return { deps: { connectDB: noConnect, Board, Task }, Board, Task };
}

test("listBoards returns only the owner's boards", async () => {
  const { deps } = setup();
  await createBoard(USER_A, { title: "A board" }, deps);
  await createBoard(USER_B, { title: "B board" }, deps);

  const result = await listBoards(USER_A, deps);

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].title, "A board");
  assert.equal(result.data[0].owner, USER_A);
});

test("createBoard uses the session owner and ignores a client-supplied owner", async () => {
  const { deps } = setup();
  const result = await createBoard(
    USER_A,
    { title: "  Mine  ", description: " d ", owner: USER_B },
    deps
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, 201);
  assert.equal(result.data.owner, USER_A);
  assert.equal(result.data.title, "Mine");
  assert.equal(result.data.description, "d");
  assert.equal(result.data.id.length, 24);
  assert.ok(!("_id" in result.data));
});

test("createBoard rejects invalid input with field details", async () => {
  const { deps } = setup();
  const result = await createBoard(USER_A, { title: "   " }, deps);

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(result.kind, "validation");
  assert.ok(result.details.title);
});

test("getBoardWithTasks returns the board and its tasks", async () => {
  const { deps, Task } = setup();
  const created = await createBoard(USER_A, { title: "Sprint" }, deps);
  const boardId = created.data.id;

  await Task.create({
    board: boardId,
    owner: USER_A,
    title: "Task 1",
    description: "",
    status: "todo",
    priority: "medium",
  });

  const result = await getBoardWithTasks(USER_A, boardId, deps);

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.data.board.id, boardId);
  assert.equal(result.data.tasks.length, 1);
  assert.equal(result.data.tasks[0].title, "Task 1");
});

test("getBoardWithTasks returns 404 for another user's board", async () => {
  const { deps } = setup();
  const created = await createBoard(USER_A, { title: "Private" }, deps);

  const result = await getBoardWithTasks(USER_B, created.data.id, deps);

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
  assert.equal(result.kind, "notFound");
});

test("getBoardWithTasks returns 400 for a malformed board id", async () => {
  const { deps } = setup();
  const result = await getBoardWithTasks(USER_A, "not-an-id", deps);

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(result.kind, "validation");
});

test("updateBoard updates the board for its owner", async () => {
  const { deps } = setup();
  const created = await createBoard(USER_A, { title: "Old" }, deps);

  const result = await updateBoard(
    USER_A,
    created.data.id,
    { title: "New", description: "desc" },
    deps
  );

  assert.equal(result.ok, true);
  assert.equal(result.data.title, "New");
  assert.equal(result.data.description, "desc");
});

test("updateBoard returns 404 for another user's board", async () => {
  const { deps } = setup();
  const created = await createBoard(USER_A, { title: "Old" }, deps);

  const result = await updateBoard(USER_B, created.data.id, { title: "Hax" }, deps);

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
});

test("updateBoard rejects an empty update", async () => {
  const { deps } = setup();
  const created = await createBoard(USER_A, { title: "Old" }, deps);

  const result = await updateBoard(USER_A, created.data.id, {}, deps);

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.ok(result.details.body);
});

test("deleteBoard removes the board and its tasks", async () => {
  const { deps, Task } = setup();
  const created = await createBoard(USER_A, { title: "Doomed" }, deps);
  const boardId = created.data.id;

  await Task.create({
    board: boardId,
    owner: USER_A,
    title: "T",
    description: "",
    status: "todo",
    priority: "medium",
  });

  const result = await deleteBoard(USER_A, boardId, deps);

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(Task.rows.length, 0);

  const after = await getBoardWithTasks(USER_A, boardId, deps);
  assert.equal(after.status, 404);
});

test("deleteBoard returns 404 for another user's board and keeps it", async () => {
  const { deps } = setup();
  const created = await createBoard(USER_A, { title: "Safe" }, deps);

  const result = await deleteBoard(USER_B, created.data.id, deps);

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
  assert.equal(deps.Board.rows.length, 1);
});

test("service functions return 500 without leaking on database failure", async () => {
  const deps = {
    connectDB: async () => {
      throw new Error("connect ECONNREFUSED 1.2.3.4:27017");
    },
    Board: createFakeModel(),
    Task: createFakeModel(),
  };

  const result = await listBoards(USER_A, deps);

  assert.equal(result.ok, false);
  assert.equal(result.status, 500);
  assert.equal(result.kind, "server");
  assert.ok(!JSON.stringify(result).includes("ECONNREFUSED"));
});
