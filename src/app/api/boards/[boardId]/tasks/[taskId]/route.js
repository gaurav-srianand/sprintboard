import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/apiAuth";
import { deleteTask, getTask, updateTask } from "@/lib/boards/taskService";
import { errorResponse, invalidJson, unauthorized } from "@/lib/boards/respond";

export async function GET(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorized();
  }

  const { boardId, taskId } = await params;
  const result = await getTask(user.id, boardId, taskId);
  if (!result.ok) {
    return errorResponse(result);
  }

  return NextResponse.json({ task: result.data }, { status: result.status });
}

export async function PATCH(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorized();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return invalidJson();
  }

  const { boardId, taskId } = await params;
  const result = await updateTask(user.id, boardId, taskId, body);
  if (!result.ok) {
    return errorResponse(result);
  }

  return NextResponse.json({ task: result.data }, { status: result.status });
}

export async function DELETE(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorized();
  }

  const { boardId, taskId } = await params;
  const result = await deleteTask(user.id, boardId, taskId);
  if (!result.ok) {
    return errorResponse(result);
  }

  return NextResponse.json({ ok: true }, { status: result.status });
}
