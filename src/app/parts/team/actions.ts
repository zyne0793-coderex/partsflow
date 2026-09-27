"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { workspace } from "@/lib/workspace";
async function finish(id?: string) {
  if (id)
    (await cookies()).set("workspace", id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  revalidatePath("/parts", "layout");
  redirect("/parts/team?saved=1");
}
export async function switchTeam(form: FormData) {
  const { teams } = await workspace(true);
  const id = String(form.get("workspace"));
  if (teams.some((t) => t.workspace_id === id)) {
    (await cookies()).set("workspace", id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    revalidatePath("/parts", "layout");
  }
  redirect("/parts/dashboard");
}
export async function createTeam(form: FormData) {
  const { db } = await workspace(true);
  const { data, error } = await db.rpc("create_workspace", {
    workspace_name: String(form.get("name") || "").trim(),
  });
  if (error) redirect("/parts/team?error=create");
  await finish(data);
}
export async function invite(form: FormData) {
  const { db, team, isAdmin, user } = await workspace();
  if (!isAdmin) redirect("/parts/team?error=permission");
  const { error } = await db.from("team_invitations").insert({
    workspace_id: team.workspace_id,
    email: String(form.get("email") || "")
      .trim()
      .toLowerCase(),
    role: String(form.get("role")),
    invited_by: user.id,
  });
  if (error)
    redirect(
      `/parts/team?error=${error.code === "23505" ? "duplicate" : "invite"}`,
    );
  await finish();
}
export async function accept(form: FormData) {
  const { db } = await workspace(true);
  const { data, error } = await db.rpc("accept_invitation", {
    invitation_id: String(form.get("id")),
  });
  if (error) redirect("/parts/team?error=expired");
  await finish(data);
}
export async function revoke(form: FormData) {
  const { db, team, isAdmin } = await workspace();
  if (!isAdmin) redirect("/parts/team?error=permission");
  const { error } = await db
    .from("team_invitations")
    .delete()
    .eq("id", String(form.get("id")))
    .eq("workspace_id", team.workspace_id);
  if (error) redirect("/parts/team?error=invite");
  await finish();
}
export async function changeMember(form: FormData) {
  const { db, team } = await workspace();
  const { error } = await db.rpc("manage_member", {
    team: team.workspace_id,
    member_id: String(form.get("id")),
    new_role: String(form.get("role")),
  });
  if (error) redirect("/parts/team?error=permission");
  await finish();
}
