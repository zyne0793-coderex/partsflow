"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Part } from "@/lib/parts";
export function PartsTable({ parts }: { parts: Part[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      parts.filter((p) =>
        [
          p.part_number,
          p.name,
          p.category,
          p.manufacturer,
          p.storage_location,
        ].some((v) => v.toLowerCase().includes(query.toLowerCase().trim())),
      ),
    [parts, query],
  );
  return (
    <Card className="shadow-sm">
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">All parts</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length} {filtered.length === 1 ? "part" : "parts"} shown
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 size-4 text-slate-400" />
          <Input
            aria-label="Search parts"
            placeholder="Search parts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/70">
                <TableHead className="pl-6">Part number</TableHead>
                <TableHead>Part name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-6 font-mono text-xs font-medium text-[#4f46e5]">
                    {p.part_number}
                  </TableCell>
                  <TableCell className="min-w-44 font-medium text-slate-900">
                    {p.name}
                  </TableCell>
                  <TableCell>{p.category || "—"}</TableCell>
                  <TableCell>{p.manufacturer || "—"}</TableCell>
                  <TableCell>{p.storage_location || "—"}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <Link
                      href={`/parts/${p.id}`}
                      className="font-medium text-[#4f46e5] hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <p className="font-medium text-slate-800">
              {query ? "No matching parts" : "No parts yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {query
                ? "Try another name or part number."
                : "Add your first part to begin the catalog."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
