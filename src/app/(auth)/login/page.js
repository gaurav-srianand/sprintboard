import { Suspense } from "react";
import Link from "next/link";

import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in · SprintBoard",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to your SprintBoard account.
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading sign-in form…
          </p>
        }
      >
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        No account?{" "}
        <Link
          href="/register"
          className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
