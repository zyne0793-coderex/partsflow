import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "@/app/login/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default async function Password(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) redirect("/login");
  return (
    <main className="mx-auto max-w-md space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      {searchParams.error && (
        <p role="alert">
          Use matching passwords of at least 8 characters. If saving failed,
          request a fresh reset link.
        </p>
      )}
      <form action={updatePassword} className="space-y-4">
        <label className="block">
          New password
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="block">
          Confirm password
          <Input
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <Button>Save password</Button>
      </form>
    </main>
  );
}
