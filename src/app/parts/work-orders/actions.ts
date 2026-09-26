"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { workspace } from "@/lib/workspace";
export async function saveOrder(form: FormData) {
  const { db, team, user, canEdit } = await workspace();
  if (!canEdit) redirect("/parts/work-orders");
  const id = String(form.get("id") || "");
  const back = id
    ? `/parts/work-orders/${encodeURIComponent(id)}`
    : "/parts/work-orders/new";
  const value = (key: string) => String(form.get(key) || "").trim();
  const order = {
    title: value("title"),
    equipment: value("equipment"),
    description: value("description"),
    priority: value("priority"),
    status: value("status") || "open",
    due_date: value("due_date") || null,
    assigned_to: value("assigned_to") || null,
    updated_at: new Date().toISOString(),
  };
  if (
    !order.title ||
    order.title.length > 160 ||
    order.equipment.length > 160 ||
    order.description.length > 4000
  )
    redirect(`${back}?error=invalid`);
  const result = id
    ? await db
        .from("work_orders")
        .update(order)
        .eq("id", id)
        .eq("workspace_id", team.workspace_id)
        .select("id")
        .single()
    : await db
        .from("work_orders")
        .insert({
          ...order,
          workspace_id: team.workspace_id,
          created_by: user.id,
        })
        .select("id")
        .single();
  if (result.error || !result.data) redirect(`${back}?error=save`);
  revalidatePath("/parts", "layout");
  redirect(`/parts/work-orders/${result.data.id}?saved=1`);
}
