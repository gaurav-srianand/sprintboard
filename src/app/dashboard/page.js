import { Suspense } from "react";

import DashboardContent from "@/components/dashboard/DashboardContent";

export const metadata = {
  title: "Dashboard · SprintBoard",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-black dark:text-zinc-400">
          Loading your dashboard…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
