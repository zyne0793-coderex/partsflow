import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Part } from "@/lib/parts";
export default async function PartDetail({ params }: { params: { id: string } }) {
  const { data } = await createClient().from("parts").select("*").eq("id", params.id).single();
  if (!data) notFound();
  const part = data as Part;
  return <div className="mx-auto max-w-7xl"><Link href="/parts" className="text-sm text-[#4f46e5] hover:underline">← Back to catalog</Link><div className="mb-7 mt-5 flex flex-wrap justify-between gap-3"><div><p className="font-mono text-sm text-[#4f46e5]">{part.part_number}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{part.name}</h1></div><Button asChild><Link href={`/parts/${part.id}/edit`}>Edit part</Link></Button></div>
    <Card className="max-w-3xl shadow-sm"><CardHeader><CardTitle className="text-base">Part details</CardTitle></CardHeader><CardContent><dl className="grid gap-6 sm:grid-cols-2">{[["Category", part.category], ["Manufacturer", part.manufacturer], ["Storage location", part.storage_location], ["Unit", part.unit], ["Description", part.description]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">{value || "—"}</dd></div>)}</dl></CardContent></Card>
  </div>;
}
