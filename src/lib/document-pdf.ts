import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { calculateDocumentTotals, formatCurrency, formatDate } from "@/lib/documents";
import { formatAddress, formatCustomerName } from "@/lib/utils";
import type { BusinessDocument, CompanySettings, Customer } from "@/types";

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 48;
const blue = rgb(0, 0.35, 0.78);
const dark = rgb(0.08, 0.12, 0.2);
const muted = rgb(0.38, 0.43, 0.5);
const light = rgb(0.94, 0.96, 0.98);
const border = rgb(0.83, 0.86, 0.9);

export async function createBusinessDocumentPdf(
  document: BusinessDocument,
  customer: Customer,
  company: CompanySettings
) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${document.type} ${document.documentNumber}`);
  pdf.setAuthor(company.companyName);
  pdf.setSubject(document.subject);
  pdf.setCreator("Handwerker Service App");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages: PDFPage[] = [];
  let page = addPage();
  let y = pageHeight - margin;

  function addPage() {
    const next = pdf.addPage([pageWidth, pageHeight]);
    pages.push(next);
    return next;
  }

  function ensureSpace(required: number) {
    if (y - required >= 74) return;
    page = addPage();
    drawPageHeader(page, company, regular, bold);
    y = pageHeight - 112;
  }

  page.drawRectangle({ x: 0, y: pageHeight - 18, width: pageWidth, height: 18, color: blue });
  drawText(page, company.companyName, margin, y, 19, bold, dark);
  y -= 23;
  drawText(page, `${company.street} · ${company.postalCode} ${company.city}`, margin, y, 9, regular, muted);
  drawText(page, `${company.phone} · ${company.email}`, margin, y - 13, 9, regular, muted);

  const companyRight = [
    company.taxNumber && `Steuernr.: ${company.taxNumber}`,
    company.vatId && `USt-IdNr.: ${company.vatId}`
  ].filter(Boolean) as string[];
  companyRight.forEach((line, index) =>
    drawTextRight(page, line, pageWidth - margin, y - index * 13, 8.5, regular, muted)
  );

  y -= 70;
  drawText(page, `${formatCustomerName(customer.firstName, customer.lastName)}`, margin, y, 10, regular, dark);
  y -= 14;
  for (const line of addressLines(customer)) {
    drawText(page, line, margin, y, 10, regular, dark);
    y -= 14;
  }

  y -= 24;
  drawText(page, document.type, margin, y, 25, bold, blue);
  y -= 34;
  drawInfoRow(page, document, regular, bold, y);
  y -= document.type === "Rechnung" || document.type === "Angebot" ? 48 : 34;

  const subjectLines = wrapText(safe(document.subject), bold, 12, pageWidth - margin * 2);
  for (const line of subjectLines) {
    drawText(page, line, margin, y, 12, bold, dark);
    y -= 16;
  }
  y -= 10;
  for (const line of wrapText(safe(document.introduction), regular, 10, pageWidth - margin * 2)) {
    drawText(page, line, margin, y, 10, regular, dark);
    y -= 14;
  }
  y -= 18;

  drawTableHeader(page, y, regular, bold);
  y -= 24;
  document.lineItems.forEach((line, index) => {
    const descriptionLines = wrapText(safe(line.description), regular, 9, 240);
    const rowHeight = Math.max(26, descriptionLines.length * 12 + 10);
    ensureSpace(rowHeight + 26);
    if (y === pageHeight - 112) {
      drawTableHeader(page, y, regular, bold);
      y -= 24;
    }
    if (index % 2 === 1)
      page.drawRectangle({
        x: margin,
        y: y - rowHeight + 5,
        width: pageWidth - margin * 2,
        height: rowHeight,
        color: light
      });
    descriptionLines.forEach((text, lineIndex) =>
      drawText(page, text, margin + 26, y - lineIndex * 12, 9, regular, dark)
    );
    drawTextRight(page, formatNumber(line.quantity), 369, y, 9, regular, dark);
    drawText(page, safe(line.unit), 378, y, 9, regular, dark);
    drawTextRight(page, formatCurrency(line.unitPrice), 472, y, 9, regular, dark);
    drawTextRight(page, formatCurrency(line.quantity * line.unitPrice), pageWidth - margin, y, 9, bold, dark);
    drawText(page, String(index + 1), margin + 4, y, 8.5, regular, muted);
    y -= rowHeight;
  });

  const totals = calculateDocumentTotals(document.lineItems);
  ensureSpace(110);
  y -= 8;
  page.drawLine({
    start: { x: 340, y: y + 8 },
    end: { x: pageWidth - margin, y: y + 8 },
    thickness: 0.8,
    color: border
  });
  drawTotalLine(page, "Nettobetrag", totals.net, y, regular, dark);
  y -= 22;
  for (const [rate, amount] of Object.entries(totals.vatByRate).sort(([a], [b]) => Number(a) - Number(b))) {
    drawTotalLine(page, `Umsatzsteuer ${formatNumber(Number(rate))} %`, amount, y, regular, dark);
    y -= 22;
  }
  y -= 6;
  page.drawRectangle({ x: 340, y: y - 8, width: pageWidth - margin - 340, height: 28, color: blue });
  drawText(page, "Gesamtbetrag", 350, y, 10, bold, rgb(1, 1, 1));
  drawTextRight(page, formatCurrency(totals.gross), pageWidth - margin - 8, y, 11, bold, rgb(1, 1, 1));
  y -= 48;

  ensureSpace(80);
  for (const line of wrapText(safe(document.notes), regular, 9.5, pageWidth - margin * 2)) {
    drawText(page, line, margin, y, 9.5, regular, dark);
    y -= 13;
  }

  if (document.type === "Rechnung") {
    y -= 16;
    ensureSpace(58);
    page.drawRectangle({
      x: margin,
      y: y - 38,
      width: pageWidth - margin * 2,
      height: 50,
      color: light,
      borderColor: border,
      borderWidth: 0.5
    });
    drawText(
      page,
      `Bank: ${safe(company.bankName)} · IBAN: ${safe(company.iban)} · BIC: ${safe(company.bic)}`,
      margin + 10,
      y - 8,
      8.5,
      regular,
      dark
    );
    drawText(page, `Verwendungszweck: ${document.documentNumber}`, margin + 10, y - 23, 8.5, bold, dark);
  }

  pages.forEach((currentPage, index) => drawFooter(currentPage, company, index + 1, pages.length, regular));
  return pdf.save();
}

export async function downloadBusinessDocumentPdf(
  document: BusinessDocument,
  customer: Customer,
  company: CompanySettings
) {
  const bytes = await createBusinessDocumentPdf(document, customer, company);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${document.documentNumber}-${slug(document.type)}.pdf`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function drawPageHeader(page: PDFPage, company: CompanySettings, regular: PDFFont, bold: PDFFont) {
  page.drawRectangle({ x: 0, y: pageHeight - 18, width: pageWidth, height: 18, color: blue });
  drawText(page, company.companyName, margin, pageHeight - 55, 12, bold, dark);
  drawTextRight(page, `${company.phone} · ${company.email}`, pageWidth - margin, pageHeight - 55, 8.5, regular, muted);
}

function drawInfoRow(page: PDFPage, document: BusinessDocument, regular: PDFFont, bold: PDFFont, y: number) {
  const cells = [
    ["Nummer", document.documentNumber],
    ["Datum", formatDate(document.issueDate)],
    document.type === "Angebot" && document.validUntil ? ["Gültig bis", formatDate(document.validUntil)] : null,
    document.type === "Rechnung" && document.dueDate ? ["Fällig am", formatDate(document.dueDate)] : null
  ].filter(Boolean) as string[][];
  const width = (pageWidth - margin * 2) / cells.length;
  cells.forEach(([label, value], index) => {
    const x = margin + index * width;
    drawText(page, label.toUpperCase(), x, y, 7.5, bold, muted);
    drawText(page, safe(value), x, y - 15, 10, regular, dark);
  });
}

function drawTableHeader(page: PDFPage, y: number, regular: PDFFont, bold: PDFFont) {
  page.drawRectangle({ x: margin, y: y - 16, width: pageWidth - margin * 2, height: 24, color: dark });
  drawText(page, "Pos.", margin + 4, y - 8, 8, bold, rgb(1, 1, 1));
  drawText(page, "Beschreibung", margin + 26, y - 8, 8, bold, rgb(1, 1, 1));
  drawTextRight(page, "Menge", 369, y - 8, 8, bold, rgb(1, 1, 1));
  drawText(page, "Einheit", 378, y - 8, 8, bold, rgb(1, 1, 1));
  drawTextRight(page, "Einzelpreis", 472, y - 8, 8, bold, rgb(1, 1, 1));
  drawTextRight(page, "Gesamt", pageWidth - margin, y - 8, 8, bold, rgb(1, 1, 1));
  void regular;
}

function drawTotalLine(
  page: PDFPage,
  label: string,
  value: number,
  y: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>
) {
  drawText(page, label, 350, y, 9, font, color);
  drawTextRight(page, formatCurrency(value), pageWidth - margin, y, 9, font, color);
}

function drawFooter(page: PDFPage, company: CompanySettings, pageNumber: number, totalPages: number, font: PDFFont) {
  page.drawLine({ start: { x: margin, y: 52 }, end: { x: pageWidth - margin, y: 52 }, thickness: 0.6, color: border });
  drawText(
    page,
    `${company.companyName} · ${company.street} · ${company.postalCode} ${company.city}`,
    margin,
    36,
    7.5,
    font,
    muted
  );
  drawTextRight(page, `Seite ${pageNumber} von ${totalPages}`, pageWidth - margin, 36, 7.5, font, muted);
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>
) {
  page.drawText(safe(text), { x, y, size, font, color });
}

function drawTextRight(
  page: PDFPage,
  text: string,
  right: number,
  y: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>
) {
  const value = safe(text);
  drawText(page, value, right - font.widthOfTextAtSize(value, size), y, size, font, color);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = safe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function addressLines(customer: Customer) {
  const address = formatAddress(customer);
  const comma = address.indexOf(",");
  if (comma < 0) return address ? [address] : [];
  return [address.slice(0, comma), address.slice(comma + 1).trim()];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(value);
}

function safe(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[–—‑]/g, "-")
    .replace(/•/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
