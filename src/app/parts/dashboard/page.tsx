import Link from "next/link";
import { workspace, number } from "@/lib/workspace";
import { Heading, panelClass } from "@/components/workspace-ui";
import { Button } from "@/components/ui/button";
export default async function Dashboard() {
  const { db, team, canEdit } = await workspace();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date());
  const [parts, low, orders, overdue, alerts, recent] = await Promise.all([
    db
      .from("parts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", team.workspace_id)
      .eq("archived", false),
    db
      .from("inventory")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", team.workspace_id)
      .eq("archived", false)
      .eq("low_stock", true),
    db
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", team.workspace_id)
      .in("status", ["open", "in_progress"]),
    db
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", team.workspace_id)
      .in("status", ["open", "in_progress"])
      .lt("due_date", today),
    db
      .from("inventory")
      .select("id,name,part_number,quantity,minimum_stock,unit")
      .eq("workspace_id", team.workspace_id)
      .eq("archived", false)
      .eq("low_stock", true)
      .order("quantity")
      .limit(8),
    db
      .from("work_orders")
      .select("id,title,status,priority,due_date")
      .eq("workspace_id", team.workspace_id)
      .in("status", ["open", "in_progress"])
      .order("due_date", { nullsFirst: false })
      .limit(8),
  ]);
  if ([parts, low, orders, overdue, alerts, recent].some((r) => r.error))
    throw new Error("Dashboard could not load");
  return (
    <div className="mx-auto max-w-7xl">
      <Heading
        title="Workshop overview"
        detail={`${team.workspaces.name} · Stock and maintenance at a glance`}
      >
        {canEdit && (
          <Button asChild>
            <Link href="/parts/work-orders/new">+ New work order</Link>
          </Button>
        )}
      </Heading>
      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Active parts", parts.count, "/parts"],
          ["Low-stock alerts", low.count, "/parts?stock=low"],
          ["Open work orders", orders.count, "/parts/work-orders"],
          ["Overdue work orders", overdue.count, "/parts/work-orders"],
        ].map(([label, value, href]) => (
          <Link href={String(href)} key={String(label)} className={panelClass}>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value || 0}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={panelClass}>
          <div className="flex justify-between">
            <h2 className="font-semibold">Needs restocking</h2>
            <Link href="/parts?stock=low" className="text-sm text-indigo-600">
              View all →
            </Link>
          </div>
          <div className="mt-4 divide-y">
            {(alerts.data || []).map((p) => (
              <Link
                href={`/parts/${p.id}`}
                key={p.id}
                className="flex justify-between gap-3 py-4"
              >
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {p.part_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-700">
                    {number(p.quantity)} {p.unit}
                  </p>
                  <p className="text-xs text-slate-500">
                    Minimum {number(p.minimum_stock)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {!alerts.data?.length && (
            <p className="py-12 text-center text-sm text-slate-500">
              No low-stock alerts.
            </p>
          )}
        </section>
        <section className={panelClass}>
          <div className="flex justify-between">
            <h2 className="font-semibold">Upcoming work</h2>
            <Link href="/parts/work-orders" className="text-sm text-indigo-600">
              View all →
            </Link>
          </div>
          <div className="mt-4 divide-y">
            {(recent.data || []).map((o) => (
              <Link
                key={o.id}
                href={`/parts/work-orders/${o.id}`}
                className="block py-4"
              >
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-medium">{o.title}</p>
                  <span className="text-xs text-indigo-600">
                    {o.status.replace("_", " ")}
                  </span>
                </div>
                <p
                  className={`mt-1 text-xs ${o.due_date && o.due_date < today ? "text-red-600" : "text-slate-500"}`}
                >
                  {o.priority} priority ·{" "}
                  {o.due_date ? `Due ${o.due_date}` : "No due date"}
                </p>
              </Link>
            ))}
          </div>
          {!recent.data?.length && (
            <p className="py-12 text-center text-sm text-slate-500">
              No open work orders.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
