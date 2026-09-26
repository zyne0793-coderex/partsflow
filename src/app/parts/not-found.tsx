import Link from "next/link";
export default function NotFound() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Item not found</h1>
      <p className="my-4 text-slate-500">
        It may belong to another workspace or you may no longer have access.
      </p>
      <Link className="text-indigo-600" href="/parts">
        Return to inventory
      </Link>
    </div>
  );
}
