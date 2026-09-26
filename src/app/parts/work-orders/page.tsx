import Link from "next/link";
import { workspace, pageNumber, searchFilter } from "@/lib/workspace";
import {
  Heading,
  Pager,
  Notice,
  panelClass,
  selectClass,
} from "@/components/workspace-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default async function Orders(props: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const s = await props.searchParams;
  const { db, team, canEdit } = await workspace();
  const page = pageNumber(s.page);
  const q = searchFilter(s.q || "");
  let query = db
    .from("work_orders")
    .select("*", { count: "exact" })
    .eq("workspace_id", team.workspace_id);
  if (q) query = query.or(`title.ilike.%${q}%,equipment.ilike.%${q}%`);
  if (s.status) query = query.eq("status", s.status);
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 25, page * 25 - 1);
  return (
    <div className="mx-auto max-w-6xl">
      <Heading
        title="Work orders"
        detail="Plan maintenance, assign your team and track the parts used."
      >
        {canEdit && (
          <Button asChild>
            <Link href="/parts/work-orders/new">+ New work order</Link>
          </Button>
        )}
      </Heading>
      <Notice error={error ? "Work orders could not load." : undefined} />
      <section className={panelClass}>
        <form className="mb-6 flex flex-wrap gap-3">
          <Input
            className="sm:max-w-sm"
            name="q"
            aria-label="Search work orders"
            placeholder="Search title or equipment…"
            defaultValue={s.q}
          />
          <select
            name="status"
            aria-label="Filter status"
            defaultValue={s.status || ""}
            className={`${selectClass} sm:w-44`}
          >
            <option value="">All statuses</option>
            {["open", "in_progress", "completed", "cancelled"].map((x) => (
              <option key={x} value={x}>
                {x.replace("_", " ")}
              </option>
            ))}
          </select>
          <Button variant="outline">Search</Button>
        </form>
        <div className="divide-y">
          {(data || []).map((o) => (
            <Link
              key={o.id}
              href={`/parts/work-orders/${o.id}`}
              className="flex flex-wrap justify-between gap-4 py-5 hover:bg-slate-50"
            >
              <div>
                <h2 className="font-semibold text-indigo-600">{o.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {o.equipment || "No equipment specified"}
                  {o.due_date && ` · Due ${o.due_date}`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-3 py-1 ${o.priority === "urgent" ? "bg-red-50 text-red-700" : "bg-slate-100"}`}
                >
                  {o.priority}
                </span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                  {o.status.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
        {!data?.length && !error && (
          <p className="py-12 text-center text-slate-500">
            No work orders found.
          </p>
        )}
        <Pager
          page={page}
          total={count || 0}
          path="/parts/work-orders"
          query={`q=${encodeURIComponent(s.q || "")}&status=${encodeURIComponent(s.status || "")}`}
        />
      </section>
    </div>
  );
}
