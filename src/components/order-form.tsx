import { saveOrder } from "@/app/parts/work-orders/actions";
import { Input } from "./ui/input";
import { SubmitButton } from "./submit-button";
import { selectClass } from "./workspace-ui";
export type Order = {
  id: string;
  title: string;
  equipment: string;
  description: string;
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
};
export function OrderForm({
  order,
  members,
}: {
  order?: Order;
  members: { user_id: string; email: string }[];
}) {
  return (
    <form action={saveOrder} className="space-y-5">
      {order && <input name="id" type="hidden" value={order.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          Title *
          <Input
            name="title"
            defaultValue={order?.title}
            maxLength={160}
            required
          />
        </label>
        <label className="space-y-2 text-sm">
          Equipment / asset
          <Input
            name="equipment"
            defaultValue={order?.equipment}
            maxLength={160}
          />
        </label>
        <label className="space-y-2 text-sm">
          Priority
          <select
            name="priority"
            className={selectClass}
            defaultValue={order?.priority || "normal"}
          >
            {["low", "normal", "high", "urgent"].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          Status
          <select
            name="status"
            className={selectClass}
            defaultValue={order?.status || "open"}
          >
            {["open", "in_progress", "completed", "cancelled"].map((x) => (
              <option key={x} value={x}>
                {x.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          Assigned to
          <select
            name="assigned_to"
            className={selectClass}
            defaultValue={order?.assigned_to || ""}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.email}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          Due date
          <Input
            name="due_date"
            type="date"
            defaultValue={order?.due_date || ""}
          />
        </label>
      </div>
      <label className="block space-y-2 text-sm">
        Description / completion notes
        <textarea
          name="description"
          defaultValue={order?.description}
          maxLength={4000}
          rows={5}
          className="w-full rounded-lg border p-3"
        />
      </label>
      <SubmitButton>
        {order ? "Save work order" : "Create work order"}
      </SubmitButton>
    </form>
  );
}
