"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type Enrollment = Readonly<{ factorId: string; qrCode: string }>;

export function MfaSetup() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function beginEnrollment() {
    setPending(true);
    setMessage("");
    const supabase = createClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const existingFactor = factors?.totp.find((factor) => factor.status === "verified");

    if (existingFactor) {
      setEnrollment({ factorId: existingFactor.id, qrCode: "" });
      setPending(false);
      return;
    }

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Handwerker App" });
    if (error) setMessage("Der zweite Faktor konnte nicht eingerichtet werden.");
    else setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code });
    setPending(false);
  }

  async function verify() {
    if (!enrollment || code.length !== 6) return;
    setPending(true);
    setMessage("");
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: enrollment.factorId
    });
    if (challengeError) {
      setMessage("Die Sicherheitsabfrage konnte nicht gestartet werden.");
      setPending(false);
      return;
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.id,
      code
    });
    if (error) {
      setMessage("Der Code ist ungültig oder abgelaufen.");
      setPending(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  if (!enrollment) {
    return (
      <Button onClick={beginEnrollment} disabled={pending}>
        {pending ? "Wird vorbereitet …" : "Zweiten Faktor einrichten"}
      </Button>
    );
  }

  return (
    <div className="space-y-5">
      {enrollment.qrCode ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">QR-Code mit einer Authenticator-App scannen.</p>
          {/* Supabase supplies this QR code as a data URI or inline SVG. */}
          <img
            src={enrollment.qrCode}
            alt="QR-Code für die Authenticator-App"
            className="mx-auto h-48 w-48 rounded-lg border bg-white p-2"
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Den aktuellen Code aus deiner Authenticator-App eingeben.</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="totp">6-stelliger Sicherheitscode</Label>
        <Input
          id="totp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        />
      </div>
      {message ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {message}
        </p>
      ) : null}
      <Button className="w-full" onClick={verify} disabled={pending || code.length !== 6}>
        {pending ? "Wird geprüft …" : "Code bestätigen"}
      </Button>
    </div>
  );
}
