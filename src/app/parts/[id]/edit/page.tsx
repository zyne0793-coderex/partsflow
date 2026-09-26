import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { workspace } from "@/lib/workspace";
import { PartForm } from "@/components/part-form";
import type { Part } from "@/lib/parts";
export default async function EditPart(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { db, team, canEdit } = await workspace();
  if (!canEdit) notFound();
  const { data } = await db
    .from("parts")
    .select("*")
    .eq("id", params.id)
    .eq("workspace_id", team.workspace_id)
    .single();
  if (!data) notFound();
  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href={`/parts/${params.id}`}
        className="text-sm text-[#4f46e5] hover:underline"
      >
        ← Back to part
      </Link>
      <h1 className="mb-2 mt-5 text-3xl font-semibold tracking-tight">
        Edit part
      </h1>
      <p className="mb-7 text-sm text-slate-500">
        Update the catalog details and save your changes.
      </p>
      <PartForm part={data as Part} error={searchParams.error} />
    </div>
  );
}
