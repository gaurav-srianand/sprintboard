"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { registerRequest } from "@/lib/api/authClient";
import Button from "@/components/ui/Button";
import FormAlert from "@/components/ui/FormAlert";
import TextField from "@/components/ui/TextField";

export default function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const alertRef = useRef(null);

  useEffect(() => {
    if (error && alertRef.current) {
      alertRef.current.focus();
    }
  }, [error]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) {
      return;
    }

    setPending(true);
    setError(null);
    setFieldErrors({});

    const result = await registerRequest({ name, email, password });

    if (result.ok) {
      router.replace("/login?registered=1");
      return;
    }

    setError(result.error);
    setFieldErrors(result.error.fieldErrors || {});
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div ref={alertRef} tabIndex={-1} className="outline-none">
        {error && <FormAlert variant="error">{error.message}</FormAlert>}
      </div>

      <TextField
        id="name"
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fieldErrors.name}
        autoComplete="name"
        placeholder="Ada Lovelace"
        disabled={pending}
      />

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
        autoComplete="new-password"
        placeholder="At least 8 characters"
        disabled={pending}
      />

      <Button
        type="submit"
        pending={pending}
        pendingLabel="Creating account…"
      >
        Create account
      </Button>
    </form>
  );
}
