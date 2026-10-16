import mongoose from "mongoose";

const boardSchema = new mongoose.Schema(
  {
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
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

boardSchema.index({ owner: 1, createdAt: -1 });

boardSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = String(ret._id);
    ret.owner = String(ret.owner);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Board = mongoose.models.Board || mongoose.model("Board", boardSchema);

export default Board;
