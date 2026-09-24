import Link from "next/link";
import { Package, Layers3, MapPin, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PartsTable } from "@/components/parts-table";
import type { Part } from "@/lib/parts";

export default async function PartsPage({ searchParams }: { searchParams: { saved?: string } }) {
  const { data, error } = await createClient().from("parts").select("id,part_number,name,category,manufacturer,storage_location,unit,description,created_at,updated_at").order("created_at", { ascending: false }).limit(1000);
  const parts = (data || []) as Part[];
  return <div className="mx-auto max-w-7xl space-y-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-slate-500">Workspace / Catalog</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Parts catalog</h1><p className="mt-2 text-sm text-slate-500">One reliable place for your spare part details.</p></div><Button asChild><Link href="/parts/new"><Plus className="mr-2 size-4" />Add part</Link></Button></div>
    {searchParams.saved === "1" && <p role="status" className="rounded-[10px] border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800">Part saved successfully.</p>}
    {error && <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">The catalog could not load. Please refresh the page.</p>}
    <div className="grid gap-4 sm:grid-cols-3">
      <Metric icon={<Package className="size-5" />} label="Cataloged parts" value={parts.length} />
      <Metric icon={<Layers3 className="size-5" />} label="Categories" value={new Set(parts.map(p => p.category).filter(Boolean)).size} />
      <Metric icon={<MapPin className="size-5" />} label="Storage locations" value={new Set(parts.map(p => p.storage_location).filter(Boolean)).size} />
    </div>
    {!error && <PartsTable parts={parts} />}
    {parts.length === 1000 && <p className="text-sm text-amber-700">Showing the 1,000 newest parts. Search and pagination will be needed before storing more than 1,000.</p>}
  </div>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <Card className="shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</p></div><div className="rounded-[10px] bg-indigo-50 p-2.5 text-[#4f46e5]">{icon}</div></CardContent></Card>;
}
