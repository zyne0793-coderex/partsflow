import Link from "next/link";
import { Button } from "@/components/ui/button";
export function Heading({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
          PartsFlow / Workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{detail}</p>
      </div>
      {children}
    </header>
  );
}
export function Notice({ error, saved }: { error?: string; saved?: string }) {
  return (
    <>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="mb-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {saved}
        </p>
      )}
    </>
  );
}
export function Pager({
  page,
  total,
  path,
  query = "",
}: {
  page: number;
  total: number;
  path: string;
  query?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / 25));
  return (
    <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
      <span>
        {total} results · Page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Button variant="outline" asChild>
            <Link href={`${path}?${query}&page=${page - 1}`}>Previous</Link>
          </Button>
        )}
        {page < pages && (
          <Button variant="outline" asChild>
            <Link href={`${path}?${query}&page=${page + 1}`}>Next</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
export const selectClass =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm";
export const panelClass =
  "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";
