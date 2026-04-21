import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface BadgeInput {
  visitorName: string;
  company: string | null;
  hostDisplayName: string;
  checkInAt: number;
  photoBytes: Uint8Array;
  escortRequired: boolean;
}

/**
 * Badge PDF sized for Brother DK-1202 die-cut labels (2.4" × 3.9").
 * 62mm × 100mm → 175.75pt × 283.46pt.
 */
const BADGE_WIDTH = 175.75;
const BADGE_HEIGHT = 283.46;

const ORANGE = rgb(0xe7 / 255, 0x6f / 255, 0x51 / 255); // FFMFG aerospace orange
const NEAR_BLACK = rgb(0x1a / 255, 0x1a / 255, 0x2e / 255);
const WHITE = rgb(1, 1, 1);

export async function renderBadgePdf(input: BadgeInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Visitor Badge - ${input.visitorName}`);
  const page = pdf.addPage([BADGE_WIDTH, BADGE_HEIGHT]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const photo = await embedPhoto(pdf, input.photoBytes);

  // Top: FFMFG header band
  const headerHeight = 24;
  page.drawRectangle({
    x: 0,
    y: BADGE_HEIGHT - headerHeight,
    width: BADGE_WIDTH,
    height: headerHeight,
    color: NEAR_BLACK,
  });
  centerText(page, "FFMFG  VISITOR", bold, 11, BADGE_HEIGHT - 16, WHITE);

  // Photo: square-ish, centered
  const photoSize = 100;
  const photoX = (BADGE_WIDTH - photoSize) / 2;
  const photoY = BADGE_HEIGHT - headerHeight - photoSize - 8;
  page.drawImage(photo, { x: photoX, y: photoY, width: photoSize, height: photoSize });
  page.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoSize,
    height: photoSize,
    borderColor: NEAR_BLACK,
    borderWidth: 0.75,
  });

  // Name
  let cursorY = photoY - 18;
  centerText(page, truncate(input.visitorName, 24), bold, 13, cursorY, NEAR_BLACK);
  cursorY -= 14;
  if (input.company) {
    centerText(page, truncate(input.company, 30), font, 9, cursorY, NEAR_BLACK);
    cursorY -= 12;
  }

  // Host
  cursorY -= 4;
  centerText(page, "Host", font, 7, cursorY, rgb(0.4, 0.4, 0.45));
  cursorY -= 10;
  centerText(page, truncate(input.hostDisplayName, 28), bold, 9, cursorY, NEAR_BLACK);
  cursorY -= 12;

  // Date
  const dateStr = new Date(input.checkInAt).toLocaleString("en-US", {
    timeZone: "America/Denver",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  centerText(page, dateStr, font, 8, cursorY, rgb(0.3, 0.3, 0.35));

  // Bottom: escort-required stripe if foreign national
  if (input.escortRequired) {
    const stripeHeight = 28;
    page.drawRectangle({
      x: 0,
      y: 0,
      width: BADGE_WIDTH,
      height: stripeHeight,
      color: ORANGE,
    });
    centerText(page, "ESCORT REQUIRED", bold, 12, 10, WHITE);
  }

  return pdf.save();
}

async function embedPhoto(pdf: PDFDocument, bytes: Uint8Array) {
  try {
    return await pdf.embedJpg(bytes);
  } catch {
    return await pdf.embedPng(bytes);
  }
}

function centerText(
  page: import("pdf-lib").PDFPage,
  text: string,
  font: import("pdf-lib").PDFFont,
  size: number,
  y: number,
  color: ReturnType<typeof rgb>,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (BADGE_WIDTH - width) / 2,
    y,
    size,
    font,
    color,
  });
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
