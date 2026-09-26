import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { workspace, number, date } from "@/lib/workspace";
import {
  Heading,
  Notice,
  panelClass,
  selectClass,
} from "@/components/workspace-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { recordStock } from "../movements/actions";
export default async function PartDetail(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const s = await props.searchParams;
  const params = await props.params;
  const { db, team, canEdit } = await workspace();
  const [
    { data: part, error },
    { data: history, error: he },
    { data: orders, error: oe },
  ] = await Promise.all([
    db
      .from("inventory")
      .select("*")
      .eq("workspace_id", team.workspace_id)
      .eq("id", params.id)
      .maybeSingle(),
    db
      .from("stock_movements")
      .select("*")
      .eq("workspace_id", team.workspace_id)
      .eq("part_id", params.id)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("work_orders")
      .select("id,title")
      .eq("workspace_id", team.workspace_id)
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  if (error || he || oe) throw new Error("Part could not load");
  if (!part) notFound();
  const errors: Record<string, string> = {
    invalid: "Enter a positive quantity and a reason.",
    stock:
      "Not enough stock available. Refresh the balance and try a smaller quantity.",
    movement:
      "Stock could not be recorded. The part may be archived, the work order closed, or your access changed.",
  };
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/parts" className="mb-5 block text-sm text-indigo-600">
        ← Parts & inventory
      </Link>
      <Heading
        title={part.name}
        detail={`${part.part_number} · ${part.category || "Uncategorized"}`}
      >
        {canEdit && (
          <Button asChild variant="outline">
            <Link href={`/parts/${part.id}/edit`}>Edit part</Link>
          </Button>
        )}
      </Heading>
      <Notice
        error={errors[s.error || ""]}
        saved={s.saved ? "Stock movement recorded." : undefined}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={panelClass}>
          <div className="mb-6 flex justify-between">
            <div>
              <p className="text-sm text-slate-500">Available stock</p>
              <p className="mt-2 text-4xl font-semibold">
                {number(part.quantity)}{" "}
                <span className="text-base font-normal text-slate-500">
                  {part.unit}
                </span>
              </p>
            </div>
            <span
              className={`h-fit rounded-full px-3 py-1 text-xs ${part.low_stock ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}
            >
              {part.archived
                ? "Archived"
                : part.low_stock
                  ? "Low stock"
                  : "In stock"}
            </span>
          </div>
          <dl className="grid gap-5 sm:grid-cols-2">
            {[
              ["Minimum stock", number(part.minimum_stock)],
              ["Location", part.storage_location],
              ["Manufacturer", part.manufacturer],
              ["Unit", part.unit],
              ["Description", part.description],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm">
                  {value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        {canEdit && !part.archived && (
          <section className={panelClass}>
            <h2 className="mb-5 text-lg font-semibold">
              Record stock movement
            </h2>
            <form action={recordStock} className="space-y-4">
              <input type="hidden" name="part_id" value={part.id} />
              <input type="hidden" name="request_id" value={randomUUID()} />
              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-2 text-sm">
                  Movement
                  <select name="direction" className={selectClass}>
                    <option value="in">Stock in / return</option>
                    <option value="out">Stock out / issue</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  Quantity ({part.unit})
                  <Input
                    name="quantity"
                    type="number"
                    min="0.001"
                    max="99999999999.999"
                    step="0.001"
                    required
                  />
                </label>
              </div>
              <label className="block space-y-2 text-sm">
                Reason / reference
                <Input
                  name="note"
                  placeholder="e.g. Delivery PO-104 or pump repair"
                  maxLength={500}
                  required
                />
              </label>
              <label className="block space-y-2 text-sm">
                Work order (optional)
                <select name="work_order_id" className={selectClass}>
                  <option value="">No work order</option>
                  {(orders || []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-slate-500">
                Entries are permanent. Correct a mistake with an opposite
                movement and an explanation.
              </p>
              <SubmitButton>Record movement</SubmitButton>
            </form>
          </section>
        )}
      </div>
      <section className={`${panelClass} mt-6`}>
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Recent movements</h2>
          <Link href="/parts/movements" className="text-sm text-indigo-600">
            All history →
          </Link>
        </div>
        <div className="mt-4 divide-y">
          {(history || []).map((m) => (
            <div
              key={m.id}
              className="flex items-start justify-between gap-4 py-4 text-sm"
            >
              <div>
                <p>{m.note}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {date(m.created_at)}
                </p>
                {m.work_order_id && (
                  <Link
                    href={`/parts/work-orders/${m.work_order_id}`}
                    className="text-xs text-indigo-600"
                  >
                    View work order
                  </Link>
                )}
              </div>
              <span
                className={`whitespace-nowrap font-semibold ${m.quantity > 0 ? "text-emerald-700" : "text-amber-700"}`}
              >
                {m.quantity > 0 ? "+" : ""}
                {number(m.quantity)} {part.unit}
              </span>
            </div>
          ))}
        </div>
        {!history?.length && (
          <p className="py-6 text-sm text-slate-500">
            No movements yet. Receive your opening stock to begin.
          </p>
        )}
        <p className="mt-4 text-xs text-slate-400">
          Latest 20 movements shown.
        </p>
      </section>
    </div>
  );
}
