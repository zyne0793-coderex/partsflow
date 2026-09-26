import Link from "next/link";
import { workspace, number, pageNumber, searchFilter } from "@/lib/workspace";
import {
  Heading,
  Notice,
  Pager,
  panelClass,
  selectClass,
} from "@/components/workspace-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default async function Parts(props: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    stock?: string;
    saved?: string;
    message?: string;
  }>;
}) {
  const s = await props.searchParams;
  const { db, team, canEdit } = await workspace();
  const page = pageNumber(s.page);
  const q = searchFilter(s.q || "");
  let query = db
    .from("inventory")
    .select("*", { count: "exact" })
    .eq("workspace_id", team.workspace_id)
    .eq("archived", s.stock === "archived");
  if (q)
    query = query.or(
      `part_number.ilike.%${q}%,name.ilike.%${q}%,category.ilike.%${q}%,manufacturer.ilike.%${q}%,storage_location.ilike.%${q}%`,
    );
  if (s.stock === "low") query = query.eq("low_stock", true);
  const {
    data: parts,
    count,
    error,
  } = await query
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 25, page * 25 - 1);
  return (
    <div className="mx-auto max-w-7xl">
      <Heading
        title="Parts & inventory"
        detail="Find a part, check its stock, and keep your workshop moving."
      >
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href="/parts/export">Export CSV</a>
          </Button>
          {canEdit && (
            <Button asChild>
              <Link href="/parts/new">+ Add part</Link>
            </Button>
          )}
        </div>
      </Heading>
      <Notice
        error={
          error
            ? "Inventory could not load. Please refresh the page."
            : undefined
        }
        saved={
          s.saved
            ? "Part saved successfully."
            : s.message === "password"
              ? "Password updated."
              : undefined
        }
      />
      <section className={panelClass}>
        <form className="mb-6 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <Input
            aria-label="Search parts"
            name="q"
            defaultValue={s.q}
            placeholder="Search number, name, category or location…"
          />
          <select
            name="stock"
            aria-label="Stock filter"
            defaultValue={s.stock || "all"}
            className={selectClass}
          >
            <option value="all">Active parts</option>
            <option value="low">Low stock</option>
            <option value="archived">Archived parts</option>
          </select>
          <Button variant="outline">Search</Button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y bg-slate-50 text-xs text-slate-500">
              <tr>
                {[
                  "Part",
                  "Category",
                  "Location",
                  "Available",
                  "Minimum",
                  "Status",
                ].map((h) => (
                  <th className="px-3 py-3 font-medium" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {(parts || []).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-3 py-4">
                    <Link
                      href={`/parts/${p.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {p.part_number}
                    </p>
                  </td>
                  <td className="px-3">{p.category || "—"}</td>
                  <td className="px-3">{p.storage_location || "—"}</td>
                  <td className="px-3 font-semibold tabular-nums">
                    {number(p.quantity)}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {p.unit}
                    </span>
                  </td>
                  <td className="px-3 tabular-nums">
                    {number(p.minimum_stock)}
                  </td>
                  <td className="px-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${p.archived ? "bg-slate-100" : p.low_stock ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}
                    >
                      {p.archived
                        ? "Archived"
                        : p.low_stock
                          ? "Low stock"
                          : "In stock"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!error && !parts?.length && (
          <p className="py-12 text-center text-sm text-slate-500">
            No parts found.{" "}
            {q
              ? "Try another search."
              : "Add a part to start tracking inventory."}
          </p>
        )}
        <Pager
          page={page}
          total={count || 0}
          path="/parts"
          query={`q=${encodeURIComponent(s.q || "")}&stock=${encodeURIComponent(s.stock || "all")}`}
        />
      </section>
    </div>
  );
}
