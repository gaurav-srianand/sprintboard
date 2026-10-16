import { Suspense } from "react";

import { requireUser } from "@/lib/auth/dal";
import AppHeader from "@/components/dashboard/AppHeader";
import BoardDetailContent from "@/components/boards/BoardDetailContent";

export const metadata = {
  title: "Board · SprintBoard",
};

function PageShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            SprintBoard
          </span>
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {children}
      </main>
    </div>
  );
}

async function BoardPageContent({ params }) {
  const user = await requireUser();
  const { boardId } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <BoardDetailContent boardId={boardId} />
      </main>
    </div>
  );
}

export default function BoardPage({ params }) {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading board…
          </div>
        </PageShell>
      }
    >
      <BoardPageContent params={params} />
    </Suspense>
  );
}
