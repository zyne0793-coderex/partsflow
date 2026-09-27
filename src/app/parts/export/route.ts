import { workspace } from "@/lib/workspace";
export async function GET() {
  const { db, team } = await workspace();
  const fields = [
    "part_number",
    "name",
    "category",
    "manufacturer",
    "storage_location",
    "unit",
    "quantity",
    "minimum_stock",
    "archived",
  ];
  const rows: string[] = [fields.join(",")];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db
      .from("inventory")
      .select(fields.join(","))
      .eq("workspace_id", team.workspace_id)
      .order("id")
      .range(offset, offset + 999);
    if (error)
      return new Response("Export failed. Please try again.", { status: 500 });
    for (const row of (data || []) as unknown as Record<string, unknown>[]) {
      rows.push(
        fields
          .map((f) => {
            let value = String(row[f] ?? "");
            if (/^[=+\-@\t\r\n]/.test(value)) value = "'" + value;
            return '"' + value.replace(/"/g, '""') + '"';
          })
          .join(","),
      );
    }
    if (!data || data.length < 1000) break;
  }
  return new Response("\uFEFF" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="partsflow-inventory.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
