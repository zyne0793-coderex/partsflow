"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Wrench,
  Users,
} from "lucide-react";
const links = [
  ["/parts/dashboard", "Overview", LayoutDashboard],
  ["/parts", "Parts & inventory", Package],
  ["/parts/movements", "Stock history", ArrowLeftRight],
  ["/parts/work-orders", "Work orders", Wrench],
  ["/parts/team", "Team & workspaces", Users],
] as const;
export function Navigation() {
  const path = usePathname();
  return (
    <nav
      aria-label="Main navigation"
      className="flex gap-1 overflow-x-auto md:flex-col"
    >
      {links.map(([href, label, Icon]) => {
        const active =
          href === "/parts"
            ? path === "/parts" ||
              /^\/parts\/(new|[0-9a-f-]{36})(\/edit)?$/.test(path)
            : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${active ? "bg-indigo-600 text-white" : "hover:bg-white/5 hover:text-white"}`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
