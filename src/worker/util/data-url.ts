/**
 * Decode a `data:image/...;base64,...` URL into raw bytes + mime.
 * Used for visitor photo and signature uploads from the iPad canvas.
 */
export function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("expected base64 data URL");
  const mime = match[1]!;
  const b64 = match[2]!;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, mime };
}
