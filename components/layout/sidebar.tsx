"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Routines", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 border-r border-neutral-200 bg-white flex flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-neutral-200">
        <Zap className="h-5 w-5 text-neutral-900" />
        <span className="font-semibold text-sm text-neutral-900 tracking-tight">
          Open Routines
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-neutral-100 text-neutral-900 font-medium"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
