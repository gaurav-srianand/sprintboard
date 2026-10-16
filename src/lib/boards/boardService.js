import connectDBDefault from "../mongodb.js";
import BoardDefault from "../../models/Board.js";
import TaskDefault from "../../models/Task.js";
import {
  isValidObjectId,
  validateBoardCreate,
  validateBoardUpdate,
} from "./validation.js";

const BOARD_SORT = { createdAt: -1 };
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

export async function listBoards(userId, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Board = deps.Board || BoardDefault;

  try {
    await connectDB();
    const boards = await Board.find({ owner: userId }).sort(BOARD_SORT);
    return { ok: true, status: 200, data: boards.map((board) => board.toJSON()) };
  } catch {
    return serverError;
  }
}

export async function createBoard(userId, body, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Board = deps.Board || BoardDefault;

  const { valid, errors, data } = validateBoardCreate(body);
  if (!valid) {
    return { ok: false, kind: "validation", status: 400, details: errors };
  }

  try {
    await connectDB();
    const board = await Board.create({
      owner: userId,
      title: data.title,
      description: data.description,
    });
    return { ok: true, status: 201, data: board.toJSON() };
  } catch {
    return serverError;
  }
}

export async function getBoardWithTasks(userId, boardId, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Board = deps.Board || BoardDefault;
  const Task = deps.Task || TaskDefault;

  if (!isValidObjectId(boardId)) {
    return invalidId("boardId");
  }

  try {
    await connectDB();
    const board = await Board.findOne({ _id: boardId, owner: userId });
    if (!board) {
      return notFound;
    }

    const tasks = await Task.find({ board: boardId, owner: userId }).sort(
      TASK_SORT
    );

    return {
      ok: true,
      status: 200,
      data: {
        board: board.toJSON(),
        tasks: tasks.map((task) => task.toJSON()),
      },
    };
  } catch {
    return serverError;
  }
}

export async function updateBoard(userId, boardId, body, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Board = deps.Board || BoardDefault;

  if (!isValidObjectId(boardId)) {
    return invalidId("boardId");
  }

  const { valid, errors, data } = validateBoardUpdate(body);
  if (!valid) {
    return { ok: false, kind: "validation", status: 400, details: errors };
  }

  try {
    await connectDB();
    const board = await Board.findOneAndUpdate(
      { _id: boardId, owner: userId },
      { $set: data },
      { new: true }
    );

    if (!board) {
      return notFound;
    }

    return { ok: true, status: 200, data: board.toJSON() };
  } catch {
    return serverError;
  }
}

export async function deleteBoard(userId, boardId, deps = {}) {
  const connectDB = deps.connectDB || connectDBDefault;
  const Board = deps.Board || BoardDefault;
  const Task = deps.Task || TaskDefault;

  if (!isValidObjectId(boardId)) {
    return invalidId("boardId");
  }

  try {
    await connectDB();

    const board = await Board.findOne({ _id: boardId, owner: userId });
    if (!board) {
      return notFound;
    }

    await Task.deleteMany({ board: boardId, owner: userId });
    await Board.deleteOne({ _id: boardId, owner: userId });

    return { ok: true, status: 200 };
  } catch {
    return serverError;
  }
}
