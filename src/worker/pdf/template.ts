/**
 * Tiny Handlebars-lite interpolator. We don't need loops or nested blocks —
 * just {{var}} and {{#if var}}...{{/if}}. Keeping this home-grown avoids
 * pulling the full handlebars dep into the Worker bundle.
 */

export function renderTemplate(
  template: string,
  vars: Record<string, string | undefined | boolean>,
): string {
  let out = template;

  out = out.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, name: string, inner: string) => {
      const v = vars[name];
      return v ? inner : "";
    },
  );

  out = out.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const v = vars[name];
    return v === undefined || v === false ? "" : String(v);
  });

  return out;
}
