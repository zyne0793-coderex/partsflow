import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
export default async function PartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) redirect("/login");
  return <AppShell email={user.email || "Signed in"}>{children}</AppShell>;
}
