import Link from "next/link";
import { workspace, number, date, pageNumber } from "@/lib/workspace";
import { Heading, Pager, Notice, panelClass } from "@/components/workspace-ui";
export default async function Movements(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { db, team } = await workspace();
  const page = pageNumber(searchParams.page);
  const { data, count, error } = await db
    .from("stock_movements")
    .select("*,parts(name,part_number,unit),work_orders(title)", {
      count: "exact",
    })
    .eq("workspace_id", team.workspace_id)
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 25, page * 25 - 1);
  return (
    <div className="mx-auto max-w-7xl">
      <Heading
        title="Stock history"
        detail="A permanent record of every receipt, issue and return."
      />
      <Notice error={error ? "Stock history could not load." : undefined} />
      <section className={panelClass}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-slate-500">
                {["Date", "Part", "Change", "Reason", "Work order"].map((h) => (
                  <th className="px-3 py-3" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data || []).map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-3 py-4">
                    {date(m.created_at)}
                  </td>
                  <td className="px-3">
                    <Link
                      className="text-indigo-600"
                      href={`/parts/${m.part_id}`}
                    >
                      {m.parts?.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {m.parts?.part_number}
                    </p>
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 font-semibold ${m.quantity > 0 ? "text-emerald-700" : "text-amber-700"}`}
                  >
                    {m.quantity > 0 ? "+" : ""}
                    {number(m.quantity)} {m.parts?.unit}
                  </td>
                  <td className="min-w-48 max-w-sm whitespace-pre-wrap break-words px-3">
                    {m.note}
                  </td>
                  <td className="px-3">
                    {m.work_order_id ? (
                      <Link
                        className="text-indigo-600"
                        href={`/parts/work-orders/${m.work_order_id}`}
                      >
                        {m.work_orders?.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data?.length && !error && (
          <p className="py-12 text-center text-slate-500">
            No stock movements yet. Open a part to receive or issue stock.
          </p>
        )}
        <Pager page={page} total={count || 0} path="/parts/movements" />
      </section>
    </div>
  );
}
