import Link from "next/link";
import { Boxes, ClipboardList, LayoutDashboard, Package, Wrench } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  return <div className="min-h-screen md:flex">
    <aside className="bg-[#0d1526] text-slate-300 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 flex flex-col px-4 py-5">
      <Link href="/parts" className="flex items-center gap-3 px-2 text-white font-semibold text-lg tracking-tight"><span className="grid size-9 place-items-center rounded-[10px] bg-[#4f46e5]">P</span>PartsFlow</Link>
      <p className="mt-9 px-3 text-[11px] uppercase tracking-widest text-slate-500">Workspace</p>
      <nav aria-label="Main navigation" className="mt-3 flex gap-1 overflow-x-auto md:flex-col">
        <Link href="/parts" aria-current="page" className="flex shrink-0 items-center gap-3 rounded-[10px] bg-[#4f46e5] px-3 py-2.5 text-sm font-medium text-white"><Package className="size-4" /> Parts catalog</Link>
        <div className="hidden md:block space-y-1 mt-1">
          {[[Boxes, "Inventory"], [Wrench, "Work orders"], [LayoutDashboard, "Dashboard"], [ClipboardList, "Billing"]].map(([Icon, label]) => {
            const ItemIcon = Icon as typeof Boxes;
            return <div key={label as string} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-500" title="Coming in a later phase"><ItemIcon className="size-4" />{label as string}<span className="ml-auto text-[10px]">Later</span></div>;
          })}
        </div>
      </nav>
      <div className="mt-auto hidden md:block border-t border-white/10 pt-5"><p className="truncate px-2 text-xs text-slate-400">{email}</p><form action={signOut}><button className="mt-3 px-2 text-sm text-slate-300 hover:text-white">Sign out</button></form></div>
      <form action={signOut} className="mt-3 md:hidden"><Button variant="outline" size="sm">Sign out</Button></form>
    </aside>
    <main className="min-w-0 flex-1 bg-[#f6f7f9] p-5 sm:p-8 lg:p-10">{children}</main>
  </div>;
}
