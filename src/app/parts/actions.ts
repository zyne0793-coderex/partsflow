"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { workspace } from "@/lib/workspace";

const units = ["pcs", "set", "box", "m", "L", "kg"];
export async function savePart(form: FormData) {
  const { db: supabase, user, team, canEdit } = await workspace();
  if (!canEdit) redirect("/parts");
  const id = String(form.get("id") || "");
  const part_number = String(form.get("part_number") || "").trim();
  const name = String(form.get("name") || "").trim();
  const description = String(form.get("description") || "").trim();
  const category = String(form.get("category") || "").trim();
  const manufacturer = String(form.get("manufacturer") || "").trim();
  const storage_location = String(form.get("storage_location") || "").trim();
  const unit = String(form.get("unit") || "pcs");
  const minimum_stock = Number(form.get("minimum_stock"));
  if (
    !part_number ||
    part_number.length > 80 ||
    !name ||
    name.length > 160 ||
    description.length > 2000 ||
    category.length > 80 ||
    manufacturer.length > 120 ||
    storage_location.length > 120 ||
    !units.includes(unit) ||
    !Number.isFinite(minimum_stock) ||
    minimum_stock < 0 ||
    minimum_stock > 99999999999.999
  ) {
    redirect(`/parts/${id ? `${id}/edit` : "new"}?error=invalid`);
  }
  const part = {
    part_number,
    name,
    description,
    category,
    manufacturer,
    storage_location,
    unit,
    minimum_stock,
    archived: form.get("archived") === "on",
  };
  const { error, data } = id
    ? await supabase
        .from("parts")
        .update({ ...part, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("workspace_id", team.workspace_id)
        .select("id")
        .single()
    : await supabase
        .from("parts")
        .insert({ ...part, owner_id: user.id, workspace_id: team.workspace_id })
        .select("id")
        .single();
  if (error || !data)
    redirect(
      `/parts/${id ? `${id}/edit` : "new"}?error=${error?.code === "23505" ? "duplicate" : "save"}`,
    );
  revalidatePath("/parts", "layout");
  redirect("/parts?saved=1");
}
