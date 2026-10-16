"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { loginRequest } from "@/lib/api/authClient";
import { safeNextPath } from "@/lib/safeRedirect";
import Button from "@/components/ui/Button";
import FormAlert from "@/components/ui/FormAlert";
import TextField from "@/components/ui/TextField";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const justRegistered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [cooldown, setCooldown] = useState(0);

  const alertRef = useRef(null);

  useEffect(() => {
    if (error && alertRef.current) {
      alertRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending || cooldown > 0) {
      return;
    }

    setPending(true);
    setError(null);
    setFieldErrors({});

    const result = await loginRequest({ email, password });

    if (result.ok) {
      router.replace(safeNextPath(nextParam));
      return;
    }

    setError(result.error);
    setFieldErrors(result.error.fieldErrors || {});
    if (result.error.kind === "rateLimited" && result.error.retryAfterSeconds) {
      setCooldown(result.error.retryAfterSeconds);
    }
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {justRegistered && (
        <FormAlert variant="success">
          Account created. Please sign in to continue.
        </FormAlert>
      )}

      <div ref={alertRef} tabIndex={-1} className="outline-none">
        {error && <FormAlert variant="error">{error.message}</FormAlert>}
      </div>

      <TextField
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
        autoComplete="email"
        placeholder="you@example.com"
        disabled={pending}
      />

      <TextField
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password}
        autoComplete="current-password"
        placeholder="••••••••"
        disabled={pending}
      />

      <Button
        type="submit"
        pending={pending}
        pendingLabel="Signing in…"
        disabled={cooldown > 0}
      >
        Sign in
      </Button>
    </form>
  );
}
