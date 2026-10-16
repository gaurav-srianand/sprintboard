import mongoose from "mongoose";

import { TASK_PRIORITIES, TASK_STATUSES } from "../lib/boards/validation.js";

const taskSchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "todo",
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "medium",
    },
  },
  { timestamps: true }
);

taskSchema.index({ board: 1, status: 1, createdAt: -1 });

taskSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = String(ret._id);
    ret.board = String(ret.board);
    ret.owner = String(ret.owner);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

export default Task;
