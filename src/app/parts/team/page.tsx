import { workspace, date } from "@/lib/workspace";
import {
  Heading,
  Notice,
  panelClass,
  selectClass,
} from "@/components/workspace-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTeam, invite, accept, revoke, changeMember } from "./actions";
export default async function Team(props: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { db, user, team, isAdmin } = await workspace(true);
  const [
    { data: members, error: memberError },
    { data: invitations, error: inviteError },
  ] = await Promise.all([
    team
      ? db
          .from("memberships")
          .select("*")
          .eq("workspace_id", team.workspace_id)
          .order("email")
      : Promise.resolve({ data: [], error: null }),
    db.from("team_invitations").select("*").order("expires_at"),
  ]);
  const errors: Record<string, string> = {
    create:
      "Workspace could not be created. Check its name and verify your email. Each owner can create up to 10 workspaces.",
    duplicate:
      "That email already has an invitation. Revoke the old invitation before trying again.",
    invite:
      "Invitation could not be saved. Check the email and your permissions.",
    expired: "Invitation expired or does not match your verified email.",
    permission: "Only the workspace owner can change or remove members.",
  };
  return (
    <div className="mx-auto max-w-5xl">
      <Heading
        title="Team & workspaces"
        detail="Share your inventory with the right people."
      />
      <Notice
        error={
          memberError || inviteError
            ? "Team details could not load. Please refresh."
            : errors[searchParams.error || ""]
        }
        saved={searchParams.saved ? "Workspace updated." : undefined}
      />
      {(invitations || [])
        .filter(
          (i) =>
            i.email === user.email?.toLowerCase() &&
            new Date(i.expires_at) > new Date(),
        )
        .map((i) => (
          <form
            action={accept}
            key={i.id}
            className={`${panelClass} mb-4 flex flex-wrap items-center justify-between gap-3`}
          >
            <div>
              <h2 className="font-semibold">Invitation to {i.workspace_name}</h2>
              <p className="text-sm text-slate-500">
                Join as {i.role} · Expires {date(i.expires_at)}
              </p>
            </div>
            <input type="hidden" name="id" value={i.id} />
            <Button>Accept invitation</Button>
          </form>
        ))}
      {team && (
        <section className={`${panelClass} mb-6`}>
          <h2 className="text-lg font-semibold">{team.workspaces.name}</h2>
          <p className="mb-5 text-sm text-slate-500">
            Owners manage members. Admins invite people. Members edit stock and
            work orders. Viewers have read-only access.
          </p>
          <div className="divide-y">
            {(members || []).map((m) => (
              <div
                key={m.user_id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <span className="break-all text-sm">
                  {m.email}
                  {m.user_id === user.id && " (you)"}
                </span>
                {team.role === "owner" && m.role !== "owner" ? (
                  <form action={changeMember} className="flex gap-2">
                    <input type="hidden" name="id" value={m.user_id} />
                    <select
                      aria-label={`Role for ${m.email}`}
                      name="role"
                      defaultValue={m.role}
                      className={selectClass}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                      <option value="remove">Remove access</option>
                    </select>
                    <Button variant="outline">Apply</Button>
                  </form>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize">
                    {m.role}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {isAdmin && (
        <section className={`${panelClass} mb-6`}>
          <h2 className="mb-2 text-lg font-semibold">Invite a teammate</h2>
          <p className="mb-5 text-sm text-slate-500">
            They can accept here after signing in with this email. Invitations
            expire after 7 days. No invitation email is sent automatically.
          </p>
          <form
            action={invite}
            className="grid gap-3 sm:grid-cols-[1fr_140px_auto]"
          >
            <Input
              name="email"
              aria-label="Teammate email"
              type="email"
              placeholder="teammate@example.com"
              maxLength={254}
              required
            />
            <select
              name="role"
              aria-label="Invitation role"
              className={selectClass}
              defaultValue="member"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button>Create invitation</Button>
          </form>
          <div className="mt-5 divide-y">
            {(invitations || [])
              .filter((i) => i.workspace_id === team.workspace_id)
              .map((i) => (
                <form
                  action={revoke}
                  key={i.id}
                  className="flex items-center justify-between gap-2 py-3 text-sm"
                >
                  <span>
                    {i.email} · {i.role} ·{" "}
                    {new Date(i.expires_at) < new Date()
                      ? "Expired"
                      : "Pending"}
                  </span>
                  <input type="hidden" name="id" value={i.id} />
                  <Button variant="outline" size="sm">
                    Revoke
                  </Button>
                </form>
              ))}
          </div>
        </section>
      )}
      <section className={panelClass}>
        <h2 className="mb-2 text-lg font-semibold">
          {team ? "Create another workspace" : "Create your first workspace"}
        </h2>
        <p className="mb-5 text-sm text-slate-500">
          Each workspace has its own parts, stock, work orders and team.
        </p>
        <form action={createTeam} className="flex gap-3">
          <Input
            name="name"
            aria-label="Workspace name"
            placeholder="e.g. Maintenance workshop"
            maxLength={100}
            required
          />
          <Button>Create workspace</Button>
        </form>
      </section>
    </div>
  );
}
