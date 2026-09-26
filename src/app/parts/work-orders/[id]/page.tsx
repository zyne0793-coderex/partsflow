import Link from "next/link";
import { notFound } from "next/navigation";
import { workspace, number, date } from "@/lib/workspace";
import { Heading, Notice, panelClass } from "@/components/workspace-ui";
import { OrderForm, type Order } from "@/components/order-form";
export default async function Detail(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const s = await props.searchParams;
  const params = await props.params;
  const { db, team, canEdit } = await workspace();
  const [
    { data: order, error },
    { data: members, error: me },
    { data: stock, error: se },
  ] = await Promise.all([
    db
      .from("work_orders")
      .select("*")
      .eq("workspace_id", team.workspace_id)
      .eq("id", params.id)
      .maybeSingle(),
    db
      .from("memberships")
      .select("user_id,email")
      .eq("workspace_id", team.workspace_id),
    db
      .from("stock_movements")
      .select("*,parts(name,unit)")
      .eq("workspace_id", team.workspace_id)
      .eq("work_order_id", params.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (error || me || se) throw new Error("Work order could not load");
  if (!order) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/parts/work-orders"
        className="mb-5 block text-sm text-indigo-600"
      >
        ← Work orders
      </Link>
      <Heading
        title={order.title}
        detail={`Created ${date(order.created_at)} · ${order.status.replace("_", " ")}`}
      />
      <Notice
        error={
          s.error
            ? "Could not save. Check the fields and your permissions."
            : undefined
        }
        saved={s.saved ? "Work order saved." : undefined}
      />
      <section className={`${panelClass} mb-6`}>
        {canEdit ? (
          <OrderForm order={order as Order} members={members || []} />
        ) : (
          <dl className="space-y-4">
            {[
              ["Equipment", order.equipment],
              ["Priority", order.priority],
              ["Due", order.due_date],
              ["Description", order.description],
              [
                "Assigned to",
                members?.find((m) => m.user_id === order.assigned_to)?.email,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="whitespace-pre-wrap">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      <section className={panelClass}>
        <h2 className="text-lg font-semibold">Parts used & returned</h2>
        <p className="mt-2 text-sm text-slate-500">
          Open a part in inventory and select this work order when recording
          stock. Closed work orders cannot receive new movements.
        </p>
        <div className="mt-4 divide-y">
          {(stock || []).map((m) => (
            <div key={m.id} className="flex justify-between gap-4 py-3 text-sm">
              <div>
                <Link href={`/parts/${m.part_id}`} className="text-indigo-600">
                  {m.parts?.name}
                </Link>
                <p className="text-slate-500">{m.note}</p>
              </div>
              <span>
                {number(m.quantity)} {m.parts?.unit}
              </span>
            </div>
          ))}
        </div>
        {!stock?.length && (
          <p className="mt-5 text-sm text-slate-500">No parts recorded yet.</p>
        )}
        {stock?.length === 100 && (
          <p className="text-sm">
            Latest 100 movements shown. See Stock history for the full record.
          </p>
        )}
      </section>
    </div>
  );
}
