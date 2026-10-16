import connectDBDefault from "../mongodb.js";
import BoardDefault from "../../models/Board.js";
import TaskDefault from "../../models/Task.js";
import {
  isValidObjectId,
  validateTaskCreate,
  validateTaskUpdate,
} from "./validation.js";

const TASK_SORT = { createdAt: 1 };

function invalidId(field) {
  return {
    ok: false,
    kind: "validation",
    status: 400,
    details: { [field]: "Invalid id" },
  };
}

const notFound = { ok: false, kind: "notFound", status: 404 };
const serverError = { ok: false, kind: "server", status: 500 };

function findOwnedBoard(Board, userId, boardId) {
  return Board.findOne({ _id: boardId, owner: userId });
}

export async function listTasks(userId, boardId, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Board = deps.Board || BoardDefault;
  const Task = deps.Task || TaskDefault;

  if (!isValidObjectId(boardId)) {
    return invalidId("boardId");
  }

  try {
    await connectDB();
    const board = await findOwnedBoard(Board, userId, boardId);
    if (!board) {
      return notFound;
    }

    const tasks = await Task.find({ board: boardId, owner: userId }).sort(
      TASK_SORT
    );

    return { ok: true, status: 200, data: tasks.map((task) => task.toJSON()) };
  } catch {
    return serverError;
  }
}

export async function createTask(userId, boardId, body, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Board = deps.Board || BoardDefault;
  const Task = deps.Task || TaskDefault;

  if (!isValidObjectId(boardId)) {
    return invalidId("boardId");
  }

  const { valid, errors, data } = validateTaskCreate(body);
  if (!valid) {
    return { ok: false, kind: "validation", status: 400, details: errors };
  }

  try {
    await connectDB();
    const board = await findOwnedBoard(Board, userId, boardId);
    if (!board) {
      return notFound;
    }

    const task = await Task.create({
      board: boardId,
      owner: userId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
    });

    return { ok: true, status: 201, data: task.toJSON() };
  } catch {
    return serverError;
  }
}

export async function getTask(userId, boardId, taskId, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Board = deps.Board || BoardDefault;
  const Task = deps.Task || TaskDefault;

  if (!isValidObjectId(boardId)) {
    return invalidId("boardId");
  }
  if (!isValidObjectId(taskId)) {
    return invalidId("taskId");
  }

  try {
    await connectDB();
    const board = await findOwnedBoard(Board, userId, boardId);
    if (!board) {
      return notFound;
    }

    const task = await Task.findOne({
      _id: taskId,
      board: boardId,
      owner: userId,
    });
    if (!task) {
      return notFound;
    }

    return { ok: true, status: 200, data: task.toJSON() };
  } catch {
    return serverError;
  }
}

export async function updateTask(userId, boardId, taskId, body, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Board = deps.Board || BoardDefault;
  const Task = deps.Task || TaskDefault;

  if (!isValidObjectId(boardId)) {
    return invalidId("boardId");
  }
  if (!isValidObjectId(taskId)) {
    return invalidId("taskId");
  }

  const { valid, errors, data } = validateTaskUpdate(body);
  if (!valid) {
    return { ok: false, kind: "validation", status: 400, details: errors };
  }

  try {
    await connectDB();
    const board = await findOwnedBoard(Board, userId, boardId);
    if (!board) {
      return notFound;
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, board: boardId, owner: userId },
      { $set: data },
      { new: true }
    );
    if (!task) {
      return notFound;
    }

    return { ok: true, status: 200, data: task.toJSON() };
  } catch {
    return serverError;
  }
}

export async function deleteTask(userId, boardId, taskId, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Board = deps.Board || BoardDefault;
  const Task = deps.Task || TaskDefault;

  if (!isValidObjectId(boardId)) {
    return invalidId("boardId");
  }
  if (!isValidObjectId(taskId)) {
    return invalidId("taskId");
  }

  try {
    await connectDB();
    const board = await findOwnedBoard(Board, userId, boardId);
    if (!board) {
      return notFound;
    }

    const result = await Task.deleteOne({
      _id: taskId,
      board: boardId,
      owner: userId,
    });
    if (!result || result.deletedCount === 0) {
      return notFound;
    }

    return { ok: true, status: 200 };
  } catch {
    return serverError;
  }
}
