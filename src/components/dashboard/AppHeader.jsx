import Link from "next/link";

import LogoutButton from "@/components/dashboard/LogoutButton";

export default function AppHeader({ user }) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/dashboard"
          className="text-base font-semibold tracking-tight text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:text-zinc-50"
        >
          SprintBoard
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-zinc-500 sm:inline dark:text-zinc-400">
            {user.email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
