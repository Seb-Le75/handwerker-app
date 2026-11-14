import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileClock, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadAuditPage } from "@/features/admin/audit-server";

const actionLabels: Record<string, string> = {
  "member.invited": "Mitarbeiter eingeladen",
  "invitation.revoked": "Einladung widerrufen",
  "membership.role_changed": "Rolle geändert",
  "membership.disabled": "Zugang deaktiviert",
  "tenant.switched": "Betrieb gewechselt",
  "tenant.created": "Betrieb angelegt"
};

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const query = await searchParams;
  const requestedPage = typeof query.page === "string" ? Number(query.page) : 1;
  const audit = await loadAuditPage(requestedPage);

  return (
    <AppShell>
      <div className="space-y-5">
        {audit.mode === "preview" ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-amber-950">
            <p className="font-semibold">Audit-Vorschau mit Beispieldaten</p>
            <p className="mt-1 text-sm">
              Die produktive Ansicht enthält ausschließlich Ereignisse des aktiven Betriebs.
            </p>
          </div>
        ) : null}

        <section className="flex flex-col gap-4 rounded-lg border border-white/70 bg-white/80 p-6 shadow-soft md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Sicherheit & Nachvollziehbarkeit</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Audit-Protokoll</h2>
            <p className="mt-2 text-muted-foreground">
              {audit.tenantName} · {audit.total} Ereignisse
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Zur Teamverwaltung
            </Link>
          </Button>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileClock className="h-5 w-5 text-primary" />
              Letzte Änderungen
            </CardTitle>
            <CardDescription>Append-only, tenantgebunden und nur mit Audit-Berechtigung sichtbar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {audit.events.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Keine sichtbaren Audit-Ereignisse.
              </div>
            ) : (
              audit.events.map((event) => (
                <article
                  key={event.id}
                  className="grid gap-3 rounded-lg border bg-secondary/20 p-4 md:grid-cols-[auto_1fr_auto] md:items-center"
                >
                  <div
                    className={
                      event.outcome === "success"
                        ? "rounded-full bg-emerald-100 p-2 text-emerald-700"
                        : "rounded-full bg-red-100 p-2 text-red-700"
                    }
                  >
                    {event.outcome === "success" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <ShieldAlert className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{actionLabels[event.action] ?? event.action}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.actorName} · {event.targetType}
                      {event.targetId ? ` · ${event.targetId.slice(0, 12)}…` : ""}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <Badge>{event.outcome === "success" ? "Erfolgreich" : event.outcome}</Badge>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("de-DE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Europe/Berlin"
                      }).format(new Date(event.occurredAt))}
                    </p>
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>

        {audit.pageCount > 1 ? (
          <nav aria-label="Audit-Seiten" className="flex items-center justify-between">
            {audit.page > 1 ? (
              <Button asChild variant="outline">
                <Link href={`/admin/audit?page=${audit.page - 1}`}>Zurück</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Zurück
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Seite {audit.page} von {audit.pageCount}
            </span>
            {audit.page < audit.pageCount ? (
              <Button asChild variant="outline">
                <Link href={`/admin/audit?page=${audit.page + 1}`}>Weiter</Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Weiter
              </Button>
            )}
          </nav>
        ) : null}
      </div>
    </AppShell>
  );
}
