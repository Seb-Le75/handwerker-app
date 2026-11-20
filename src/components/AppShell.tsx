"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarRange,
  ClipboardList,
  Files,
  HardHat,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRoundPlus,
  UsersRound
} from "lucide-react";

import { StorageStatus } from "@/components/StorageStatus";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";

const fieldNavItems = [
  { href: "/", label: "Heute", icon: LayoutDashboard },
  { href: "/jobs", label: "Aufträge", icon: ClipboardList },
  { href: "/new", label: "Auftrag erfassen", icon: UserRoundPlus },
  { href: "/customers", label: "Kunden", icon: UsersRound }
];

const officeNavItems = [
  { href: "/office", label: "Büroübersicht", icon: BriefcaseBusiness },
  { href: "/new", label: "Neuer Auftrag", icon: UserRoundPlus },
  { href: "/planning", label: "Planung", icon: CalendarRange },
  { href: "/jobs", label: "Aufträge", icon: ClipboardList },
  { href: "/customers", label: "Kunden", icon: UsersRound },
  { href: "/documents", label: "Dokumente", icon: Files },
  { href: "/admin", label: "Team", icon: ShieldCheck },
  { href: "/settings", label: "Einstellungen", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [workArea, setWorkArea] = useLocalStorage<"field" | "office">("hsa-work-area", "field");
  const officeOnlyRoute =
    pathname === "/office" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/planning") ||
    pathname.startsWith("/documents");
  const isOffice = officeOnlyRoute || workArea === "office";
  const navItems = isOffice ? officeNavItems : fieldNavItems;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="print-hidden mb-5 grid gap-4 rounded-lg border border-white/70 bg-white/78 p-4 shadow-soft backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href={isOffice ? "/office" : "/"} className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
              HS
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">SHK Einsatzsteuerung</p>
              <h1 className="text-xl font-semibold tracking-normal">Handwerker Service App</h1>
              <StorageStatus />
            </div>
          </Link>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/70 p-1" aria-label="Arbeitsbereich wählen">
            <Link
              href="/"
              onClick={() => setWorkArea("field")}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors",
                !isOffice ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HardHat className="h-4 w-4" />
              Baustelle
            </Link>
            <Link
              href="/office"
              onClick={() => setWorkArea("office")}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors",
                isOffice ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Büro
            </Link>
          </div>
        </div>
        <nav
          className={cn(
            "grid gap-2",
            isOffice ? "grid-cols-2 sm:grid-cols-4 xl:grid-cols-8" : "grid-cols-2 lg:grid-cols-4"
          )}
        >
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
