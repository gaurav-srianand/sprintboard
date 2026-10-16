import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/apiAuth";
import {
  deleteBoard,
  getBoardWithTasks,
  updateBoard,
} from "@/lib/boards/boardService";
import { errorResponse, invalidJson, unauthorized } from "@/lib/boards/respond";

export async function GET(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorized();
  }

  const { boardId } = await params;
  const result = await getBoardWithTasks(user.id, boardId);
  if (!result.ok) {
    return errorResponse(result);
  }

  return NextResponse.json(result.data, { status: result.status });
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

  const { boardId } = await params;
  const result = await updateBoard(user.id, boardId, body);
  if (!result.ok) {
    return errorResponse(result);
  }

  return NextResponse.json({ board: result.data }, { status: result.status });
}

export async function DELETE(request, { params }) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorized();
  }

  const { boardId } = await params;
  const result = await deleteBoard(user.id, boardId);
  if (!result.ok) {
    return errorResponse(result);
  }

  return NextResponse.json({ ok: true }, { status: result.status });
}
