import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/apiAuth";
import { createTask, listTasks } from "@/lib/boards/taskService";
import { errorResponse, invalidJson, unauthorized } from "@/lib/boards/respond";

export async function GET(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorized();
  }

  const { boardId } = await params;
  const result = await listTasks(user.id, boardId);
  if (!result.ok) {
    return errorResponse(result);
  }

  return NextResponse.json({ tasks: result.data }, { status: result.status });
}

export async function POST(request, { params }) {
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

  const { boardId } = await params;
  const result = await createTask(user.id, boardId, body);
  if (!result.ok) {
    return errorResponse(result);
  }

  return NextResponse.json({ task: result.data }, { status: result.status });
}
