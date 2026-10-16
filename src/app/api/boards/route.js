import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/apiAuth";
import { createBoard, listBoards } from "@/lib/boards/boardService";
import { errorResponse, invalidJson, unauthorized } from "@/lib/boards/respond";

export async function GET(request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorized();
  }

  const result = await listBoards(user.id);
  if (!result.ok) {
    return errorResponse(result);
  }

  return NextResponse.json({ boards: result.data }, { status: result.status });
}

export async function POST(request) {
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

  const result = await createBoard(user.id, body);
  if (!result.ok) {
    return errorResponse(result);
  }

  return NextResponse.json({ board: result.data }, { status: result.status });
}
