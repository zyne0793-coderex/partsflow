import Link from "next/link";
import { PartForm } from "@/components/part-form";
import { workspace } from "@/lib/workspace";
import { redirect } from "next/navigation";
export default async function NewPart(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { canEdit } = await workspace();
  if (!canEdit) redirect("/parts");
  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/parts" className="text-sm text-[#4f46e5] hover:underline">
        ← Back to catalog
      </Link>
      <h1 className="mb-2 mt-5 text-3xl font-semibold tracking-tight">
        Add a part
      </h1>
      <p className="mb-7 text-sm text-slate-500">
        Save the details your team uses to identify this item.
      </p>
      <PartForm error={searchParams.error} />
    </div>
  );
}
