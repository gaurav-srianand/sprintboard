import Link from "next/link";

import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create account · SprintBoard",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Create your account
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Start organizing your work in minutes.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
