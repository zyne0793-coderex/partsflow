import { redirect } from "next/navigation";
import { workspace } from "@/lib/workspace";
import { Heading, Notice, panelClass } from "@/components/workspace-ui";
import { OrderForm } from "@/components/order-form";
export default async function NewOrder(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { db, team, canEdit } = await workspace();
  if (!canEdit) redirect("/parts/work-orders");
  const { data, error } = await db
    .from("memberships")
    .select("user_id,email")
    .eq("workspace_id", team.workspace_id)
    .order("email");
  if (error) throw new Error("Could not load teammates");
  return (
    <div className="mx-auto max-w-3xl">
      <Heading
        title="New work order"
        detail="Describe the job and choose who will handle it."
      />
      <Notice
        error={
          searchParams.error
            ? "Could not save. Check the fields and try again."
            : undefined
        }
      />
      <section className={panelClass}>
        <OrderForm members={data || []} />
      </section>
    </div>
  );
}
