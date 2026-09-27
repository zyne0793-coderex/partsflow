import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { switchTeam } from "@/app/parts/team/actions";
import { workspace } from "@/lib/workspace";
import { Navigation } from "./navigation";
export async function AppShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const { teams, team } = await workspace(true);
  return (
    <div className="min-h-screen md:flex">
      <aside className="flex flex-col bg-[#0d1526] px-4 py-5 text-slate-300 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
        <Link
          href="/parts/dashboard"
          className="flex items-center gap-3 px-2 text-lg font-semibold tracking-tight text-white"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-indigo-600">
            P
          </span>
          PartsFlow
        </Link>
        <form action={switchTeam} className="my-6 space-y-2">
          <label htmlFor="workspace" className="px-2 text-xs text-slate-400">
            Current workspace
          </label>
          <select
            id="workspace"
            name="workspace"
            defaultValue={team?.workspace_id}
            className="w-full rounded-lg border border-white/10 bg-slate-800 p-2 text-sm text-white"
          >
            {teams.length === 0 && <option>Create a workspace</option>}
            {teams.map((t) => (
              <option key={t.workspace_id} value={t.workspace_id}>
                {t.workspaces.name}
              </option>
            ))}
          </select>
          {teams.length > 1 && (
            <button className="text-xs text-indigo-300">
              Switch workspace →
            </button>
          )}
        </form>
        <Navigation />
        <div className="mt-6 border-t border-white/10 pt-5 md:mt-auto">
          <p className="truncate px-2 text-xs text-slate-400">{email}</p>
          <div className="mt-3 flex justify-between px-2 text-sm">
            <Link href="/auth/password" className="hover:text-white">
              Password
            </Link>
            <form action={signOut}>
              <button className="hover:text-white">Sign out</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-[#f6f7f9] p-5 sm:p-8 lg:p-10">
        {children}
      </main>
    </div>
  );
}
