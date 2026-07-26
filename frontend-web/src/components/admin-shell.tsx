"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Bell, Search, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const { name, role, isSuperAdmin, logout } = useAuth();

  const nav = isSuperAdmin
    ? [
        { to: "/admin", label: "Coach Admin" },
        { to: "/super-admin", label: "Super Admin" },
      ]
    : [{ to: "/admin", label: "Dashboard" }];

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="ambient-orb animate-float top-[-10%] left-[-5%] h-96 w-96 bg-teal/20" />
        <div
          className="ambient-orb animate-float top-[40%] right-[-8%] h-[28rem] w-[28rem] bg-violet/20"
          style={{ animationDelay: "-4s" }}
        />
      </div>

      <div className="relative flex min-h-screen w-full">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl md:flex md:flex-col">
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-teal to-violet shadow-[0_8px_24px_-8px_var(--teal-glow)] animate-pulse-glow">
              <Zap className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-tight">GymApp</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-teal">Admin</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-teal/20 to-transparent text-teal"
                      : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2.5">
              <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-teal to-violet text-xs font-bold text-primary-foreground">
                {(name || "A").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{name}</div>
                <div className="truncate font-mono text-[10px] uppercase tracking-widest text-teal">
                  {role?.replace("_", " ")}
                </div>
              </div>
              <button onClick={logout} title="Log out">
                <LogOut className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/70 px-6 backdrop-blur-xl lg:px-8">
            <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
            <div className="ml-auto flex items-center gap-3">
              <div className="relative hidden max-w-xs md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search…"
                  className="h-9 w-56 rounded-full border border-border bg-surface/60 pl-9 pr-4 text-sm outline-none focus:border-teal/50"
                />
              </div>
              <button className="relative grid size-9 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground hover:text-foreground">
                <Bell className="size-4" />
              </button>
            </div>
          </header>
          <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
