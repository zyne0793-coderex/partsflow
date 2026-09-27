import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export const workspace = cache(async (optional = false) => {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await db
    .from("memberships")
    .select("workspace_id,role,workspaces(name)")
    .eq("user_id", user.id);
  if (error) throw new Error("Workspace could not load. Please try again.");
  const teams = (data || []) as unknown as {
    workspace_id: string;
    role: string;
    workspaces: { name: string };
  }[];
  const selected = (await cookies()).get("workspace")?.value;
  const team = teams.find((t) => t.workspace_id === selected) || teams[0];
  if (!team && !optional) redirect("/parts/team");
  return {
    db,
    user,
    team,
    teams,
    canEdit: !!team && team.role !== "viewer",
    isAdmin: !!team && ["owner", "admin"].includes(team.role),
  };
});
export const number = (value: unknown) =>
  new Intl.NumberFormat("en-MY", { maximumFractionDigits: 3 }).format(
    Number(value),
  );
export const date = (value: string) =>
  new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value));
export function pageNumber(value?: string) {
  return Math.max(1, Math.min(100000, Number.parseInt(value || "1", 10) || 1));
}
export function searchFilter(value: string) {
  return value
    .replace(/[,%_()."\\]/g, " ")
    .trim()
    .slice(0, 100);
}
