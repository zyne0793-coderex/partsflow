import Link from "next/link";
import { savePart } from "@/app/parts/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Part } from "@/lib/parts";

export function PartForm({ part, error }: { part?: Part; error?: string }) {
  const messages: Record<string, string> = {
    invalid: "Check the required fields and their lengths.",
    duplicate: "That part number already exists in your catalog.",
    save: "The part could not be saved. Please try again.",
  };
  return <Card className="max-w-3xl shadow-sm"><CardContent className="pt-6">
    {error && messages[error] && <p role="alert" className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-700">{messages[error]}</p>}
    <form action={savePart} className="space-y-6">
      {part && <input type="hidden" name="id" value={part.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Part number" name="part_number" value={part?.part_number} maxLength={80} required mono />
        <Field label="Part name" name="name" value={part?.name} maxLength={160} required />
        <Field label="Category" name="category" value={part?.category} maxLength={80} placeholder="e.g. Bearings" />
        <Field label="Manufacturer" name="manufacturer" value={part?.manufacturer} maxLength={120} placeholder="e.g. SKF" />
        <Field label="Storage location" name="storage_location" value={part?.storage_location} maxLength={120} placeholder="e.g. Rack A-03" />
        <div className="space-y-2"><Label htmlFor="unit">Unit</Label><select id="unit" name="unit" defaultValue={part?.unit || "pcs"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {["pcs", "set", "box", "m", "L", "kg"].map(unit => <option key={unit} value={unit}>{unit}</option>)}
        </select></div>
      </div>
      <div className="space-y-2"><Label htmlFor="description">Description</Label><textarea id="description" name="description" maxLength={2000} defaultValue={part?.description || ""} rows={4} placeholder="Dimensions, specifications or supplier notes" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
      <div className="flex justify-end gap-3 border-t pt-5"><Button asChild variant="outline"><Link href="/parts">Cancel</Link></Button><Button type="submit">{part ? "Save changes" : "Add part"}</Button></div>
    </form>
  </CardContent></Card>;
}

function Field({ label, name, value, maxLength, placeholder, required, mono }: { label: string; name: string; value?: string; maxLength: number; placeholder?: string; required?: boolean; mono?: boolean }) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}{required && " *"}</Label><Input id={name} name={name} defaultValue={value || ""} maxLength={maxLength} placeholder={placeholder} required={required} className={mono ? "font-mono" : ""} /></div>;
}
