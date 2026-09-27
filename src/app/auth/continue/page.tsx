import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function Continue() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) redirect("/login?error=confirmation");
  return (
    <main className="mx-auto max-w-lg space-y-6 p-10">
      <h1 className="text-2xl font-semibold">You’re signed in</h1>
      <p>
        Your email link was accepted. If you requested a password reset, choose
        a new password now.
      </p>
      <Link className="block text-indigo-600 underline" href="/auth/password">
        Set a new password
      </Link>
      <Link className="block text-indigo-600 underline" href="/parts">
        Continue to PartsFlow →
      </Link>
    </main>
  );
}
