"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BusinessDocument, CompanySettings, Customer } from "@/types";

export function PdfDownloadButton({
  document,
  customer,
  company
}: {
  document: BusinessDocument;
  customer: Customer;
  company: CompanySettings;
}) {
  const [creating, setCreating] = useState(false);

  async function download() {
    setCreating(true);
    try {
      const { downloadBusinessDocumentPdf } = await import("@/lib/document-pdf");
      await downloadBusinessDocumentPdf(document, customer, company);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Button type="button" size="lg" onClick={download} disabled={creating}>
      <Download className="h-5 w-5" />
      {creating ? "PDF wird erstellt" : "PDF herunterladen"}
    </Button>
  );
}
