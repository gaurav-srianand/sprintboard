"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { logoutRequest } from "@/lib/api/authClient";
import Button from "@/components/ui/Button";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await logoutRequest();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      fullWidth={false}
      pending={pending}
      pendingLabel="Signing out…"
      onClick={handleLogout}
    >
      Sign out
    </Button>
  );
}
