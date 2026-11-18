import { AppShell } from "@/components/AppShell";
import { DocumentEditor } from "@/components/DocumentEditor";
import type { BusinessDocumentType } from "@/types";

const allowedTypes: BusinessDocumentType[] = ["Angebot", "Auftragsbestätigung", "Rechnung"];

export default async function NewDocumentPage({
  searchParams
}: {
  searchParams: Promise<{ jobId?: string; type?: string; documentId?: string; sourceId?: string }>;
}) {
  const query = await searchParams;
  const type = allowedTypes.find((item) => item === query.type);
  return (
    <AppShell>
      <DocumentEditor jobId={query.jobId} type={type} documentId={query.documentId} sourceId={query.sourceId} />
    </AppShell>
  );
}
