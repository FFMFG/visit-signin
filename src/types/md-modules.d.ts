// Cloudflare Workers supports .md as Text modules via the `rules` config.
// These declarations let TypeScript import them as string.
declare module "*.md" {
  const content: string;
  export default content;
}
