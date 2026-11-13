"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Settings, ShieldCheck, UserRoundPlus, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new", label: "Neuer Auftrag", icon: UserRoundPlus },
  { href: "/jobs", label: "Auftraege", icon: ClipboardList },
  { href: "/customers", label: "Kunden", icon: UsersRound },
  { href: "/admin", label: "Team", icon: ShieldCheck },
  { href: "/settings", label: "Einstellungen", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="print-hidden mb-5 flex flex-col gap-4 rounded-lg border border-white/70 bg-white/78 p-4 shadow-soft backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
            HS
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">SHK Einsatzsteuerung</p>
            <h1 className="text-xl font-semibold tracking-normal">Handwerker Service App</h1>
          </div>
        </Link>
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.href}
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
