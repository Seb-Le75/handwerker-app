import { Building2, CheckCircle2, Clock3, KeyRound, MailPlus, ShieldCheck, UsersRound } from "lucide-react";

import { InviteMemberForm } from "@/app/admin/InviteMemberForm";
import { InvitationControls } from "@/app/admin/InvitationControls";
import { MemberControls } from "@/app/admin/MemberControls";
import { hasPermission } from "@/auth/authorization";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadAdminOverview } from "@/features/admin/server";

const roleColors: Record<string, string> = {
  owner_admin: "border-blue-200 bg-blue-50 text-blue-800",
  office_dispatch: "border-violet-200 bg-violet-50 text-violet-800",
  technician: "border-emerald-200 bg-emerald-50 text-emerald-800"
};

export default async function AdminPage() {
  const overview = await loadAdminOverview();
  const canInvite = hasPermission(overview.permissions, "members.invite");
  const canChangeRoles = hasPermission(overview.permissions, "members.role.assign");
  const canDisable = hasPermission(overview.permissions, "members.disable");
  const preview = overview.mode === "preview";

  return (
    <AppShell>
      <div className="space-y-5">
        {overview.mode === "preview" ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-amber-950">
            <p className="font-semibold">Lokale Vorschau mit Beispieldaten</p>
            <p className="mt-1 text-sm">
              Noch keine echten Konten oder Betriebsdaten. Nach der Supabase-Verbindung wird dieser Modus automatisch
              abgeschaltet.
            </p>
          </div>
        ) : null}

        <section className="flex flex-col gap-4 rounded-lg border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Betrieb & Team</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">{overview.tenant.legalName}</h2>
            <p className="mt-2 text-muted-foreground">
              {overview.tenant.locale} · {overview.tenant.timezone}
            </p>
          </div>
          <Button asChild>
            <a href="#einladung">
              <MailPlus className="h-4 w-4" />
              Mitarbeiter einladen
            </a>
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-md bg-primary/10 p-3 text-primary">
                <Building2 />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktiver Betrieb</p>
                <p className="font-semibold">{overview.tenant.slug}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-md bg-accent/10 p-3 text-accent">
                <UsersRound />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teammitglieder</p>
                <p className="font-semibold">{overview.members.length} aktive Zugänge</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-md bg-emerald-100 p-3 text-emerald-700">
                <KeyRound />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sicherheitsstufe</p>
                <p className="font-semibold">{overview.viewer.assuranceLevel.toUpperCase()} · 2. Faktor</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card id="einladung">
          <CardHeader>
            <CardTitle>Mitarbeiter einladen</CardTitle>
            <CardDescription>
              Der Einladungslink ist einmalig, wird nur gehasht gespeichert und läuft nach sieben Tagen ab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMemberForm roles={overview.roles} preview={preview || !canInvite} />
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Teamzugänge</CardTitle>
              <CardDescription>Rollen und Status aller Mitglieder dieses Betriebs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 rounded-lg border bg-secondary/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{member.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={roleColors[member.roleCode]}>{member.roleLabel}</Badge>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="Aktiv" />
                  </div>
                  <MemberControls
                    membershipId={member.id}
                    currentRole={member.roleCode}
                    roles={overview.roles}
                    canChangeRole={!preview && canChangeRoles}
                    canDisable={!preview && canDisable}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Dein Zugang</CardTitle>
                <CardDescription>{overview.viewer.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={roleColors[overview.viewer.roleCode]}>{overview.viewer.roleLabel}</Badge>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{overview.permissions.length} Berechtigungen für diese Rolle aktiv.</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Offene Einladungen</CardTitle>
                <CardDescription>{overview.invitations.length} noch nicht angenommene Einladungen.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overview.invitations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine offenen Einladungen.</p>
                ) : (
                  overview.invitations.map((invitation) => (
                    <div key={invitation.id} className="rounded-lg border bg-secondary/30 p-3">
                      <p className="truncate text-sm font-semibold">{invitation.email}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Badge>{invitation.roleLabel}</Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          bis {new Intl.DateTimeFormat("de-DE").format(new Date(invitation.expiresAt))}
                        </span>
                      </div>
                      <InvitationControls invitationId={invitation.id} enabled={!preview && canInvite} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Nächster Ausbau</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-emerald-700">✓ Einladungen sicher vorbereiten</p>
                <p className="text-emerald-700">✓ Rollenwechsel auditieren</p>
                <p className="text-emerald-700">✓ Letzten Admin schützen</p>
                <p>Als Nächstes: Annahme und E-Mail-Zustellung</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
