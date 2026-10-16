import { registerUser } from "@/lib/auth/registerUser";

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await registerUser(body);

  if (result.ok) {
    return Response.json({ user: result.user }, { status: result.status });
  }

  if (result.kind === "validation") {
    return Response.json(
      { error: "Validation failed", details: result.details },
      { status: result.status }
    );
  }

  if (result.kind === "duplicate") {
    return Response.json(
      { error: "Email already registered" },
      { status: result.status }
    );
  }

  return Response.json(
    { error: "Something went wrong" },
    { status: result.status }
  );
}
