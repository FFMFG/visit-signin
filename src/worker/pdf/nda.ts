import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import usPersonTemplate from "../../../templates/us-person-nda.md?raw";
import foreignNationalTemplate from "../../../templates/foreign-national-nda.md?raw";
import type { Citizenship } from "@shared/types";
import { renderTemplate } from "./template";

export interface NdaInput {
  visitorName: string;
  company: string | undefined;
  hostDisplayName: string;
  purpose: string;
  citizenship: Citizenship;
  signatureImageBytes: Uint8Array;
  sessionId: string;
  dateIso: string;
}

export function selectNdaTemplate(citizenship: Citizenship): string {
  return citizenship === "foreign_national" ? foreignNationalTemplate : usPersonTemplate;
}

/**
 * Render the NDA. Signature image is stamped where the template marker
 * `{{signatureImage}}` appears in the source, regardless of body layout.
 * The PDF is text-first (pdf-lib), with the signature embedded as an image
 * at the marker's approximate vertical position.
 */
export async function renderNdaPdf(input: NdaInput): Promise<Uint8Array> {
  const template = selectNdaTemplate(input.citizenship);
  const formattedDate = new Date(input.dateIso).toLocaleString("en-US", {
    timeZone: "America/Denver",
    dateStyle: "long",
    timeStyle: "short",
  });

  const body = renderTemplate(template, {
    visitorName: input.visitorName,
    company: input.company ?? "(independent)",
    hostDisplayName: input.hostDisplayName,
    purpose: input.purpose,
    date: formattedDate,
    sessionId: input.sessionId,
    signatureImage: "[SIGNATURE]",
  });

  const pdf = await PDFDocument.create();
  pdf.setTitle(`NDA - ${input.visitorName}`);
  pdf.setAuthor("Final Frontier Manufacturing");
  pdf.setSubject(
    input.citizenship === "foreign_national"
      ? "Foreign National Visitor NDA"
      : "U.S. Person Visitor NDA",
  );
  pdf.setCreationDate(new Date(input.dateIso));

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const signatureImage = await embedSignature(pdf, input.signatureImageBytes);

  const margin = 54; // 0.75"
  const pageWidth = 612; // 8.5"
  const pageHeight = 792; // 11"
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 14;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawLine = (text: string, opts: { bold?: boolean; size?: number } = {}) => {
    const f = opts.bold ? bold : font;
    const size = opts.size ?? 10;
    const wrapped = wrap(text, f, size, contentWidth);
    for (const line of wrapped) {
      if (y < margin + lineHeight) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, { x: margin, y, size, font: f, color: rgb(0.1, 0.1, 0.2) });
      y -= lineHeight;
    }
  };

  for (const rawLine of body.split("\n")) {
    const line = rawLine.trimEnd();
    if (line === "[SIGNATURE]") {
      if (y < margin + 80) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      y -= 6;
      const sigWidth = 220;
      const sigHeight = 70;
      page.drawRectangle({
        x: margin,
        y: y - sigHeight,
        width: sigWidth,
        height: sigHeight,
        borderColor: rgb(0.7, 0.7, 0.75),
        borderWidth: 0.5,
      });
      page.drawImage(signatureImage, {
        x: margin + 5,
        y: y - sigHeight + 5,
        width: sigWidth - 10,
        height: sigHeight - 10,
      });
      y -= sigHeight + 10;
      continue;
    }
    if (line === "") {
      y -= lineHeight / 2;
      continue;
    }
    if (line.startsWith("# ")) {
      y -= 4;
      drawLine(line.slice(2), { bold: true, size: 16 });
      y -= 4;
    } else if (line.startsWith("## ")) {
      y -= 2;
      drawLine(line.slice(3), { bold: true, size: 12 });
      y -= 2;
    } else if (line.startsWith("- ")) {
      drawLine(`  • ${line.slice(2)}`);
    } else if (line === "---") {
      if (y < margin + 20) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawLine({
        start: { x: margin, y: y - 4 },
        end: { x: pageWidth - margin, y: y - 4 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.82),
      });
      y -= 14;
    } else {
      drawLine(stripMarkdown(line));
    }
  }

  return pdf.save();
}

async function embedSignature(pdf: PDFDocument, bytes: Uint8Array) {
  // Signature canvas exports as PNG
  try {
    return await pdf.embedPng(bytes);
  } catch {
    return await pdf.embedJpg(bytes);
  }
}

function stripMarkdown(line: string): string {
  return line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

function wrap(text: string, font: import("pdf-lib").PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const trial = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}
