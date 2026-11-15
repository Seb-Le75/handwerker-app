import { AppShell } from "@/components/AppShell";
import { JobWizard } from "@/components/JobWizard";

export default async function NewJobPage({
  searchParams
}: {
  searchParams: Promise<{ customerId?: string; jobId?: string; step?: string }>;
}) {
  const query = await searchParams;
  return (
    <AppShell>
      <JobWizard
        initialCustomerId={query.customerId}
        editJobId={query.jobId}
        initialStep={query.step === "acceptance" ? 6 : undefined}
      />
    </AppShell>
  );
}
