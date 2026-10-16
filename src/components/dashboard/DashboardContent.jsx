import { requireUser } from "@/lib/auth/dal";
import AppHeader from "@/components/dashboard/AppHeader";
import BoardsView from "@/components/dashboard/BoardsView";

export default async function DashboardContent() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader user={user} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <BoardsView userName={user.name} />
      </main>
    </div>
  );
}
