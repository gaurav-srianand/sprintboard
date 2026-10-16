import { NextResponse } from "next/server";

export function unauthorized() {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}

export function invalidJson() {
  return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
}

export function errorResponse(result) {
  if (result.kind === "validation") {
    return NextResponse.json(
      { error: "Validation failed", details: result.details },
      { status: result.status }
    );
  }

  if (result.kind === "notFound") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { error: "Something went wrong" },
    { status: result.status || 500 }
  );
}
