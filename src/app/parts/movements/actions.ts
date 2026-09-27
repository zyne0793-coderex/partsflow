"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { workspace } from "@/lib/workspace";
export async function recordStock(form: FormData) {
  const { db, team, user, canEdit } = await workspace();
  const part = String(form.get("part_id"));
  const back = `/parts/${encodeURIComponent(part)}`;
  if (!canEdit) redirect(back);
  const amount = Number(form.get("quantity"));
  const direction = String(form.get("direction"));
  const note = String(form.get("note") || "").trim();
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 99999999999.999 ||
    !["in", "out"].includes(direction) ||
    !note ||
    note.length > 500
  )
    redirect(`${back}?error=invalid`);
  const { error } = await db
    .from("stock_movements")
    .insert({
      id: String(form.get("request_id")),
      workspace_id: team.workspace_id,
      part_id: part,
      quantity: direction === "out" ? -amount : amount,
      note,
      work_order_id: String(form.get("work_order_id") || "") || null,
      created_by: user.id,
    });
  if (error && error.code !== "23505")
    redirect(
      `${back}?error=${error.message.includes("Insufficient stock") ? "stock" : "movement"}`,
    );
  revalidatePath("/parts", "layout");
  redirect(`${back}?saved=1`);
}
