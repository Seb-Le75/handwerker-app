"use client";

"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/AppShell";

// JobWizard is a client component that uses useSearchParams; load it dynamically with no SSR
const JobWizard = dynamic(() => import("@/components/JobWizard").then((mod) => mod.JobWizard), { ssr: false });

export default function NewJobPage() {
  return (
    <AppShell>
      <JobWizard />
    </AppShell>
  );
}
