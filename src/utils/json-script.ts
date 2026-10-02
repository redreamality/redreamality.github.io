/** JSON embedded in an HTML script element must not contain a literal "<". */
export function serializeJsonForScript(value: unknown): string {
  const json = JSON.stringify(value);
  if (typeof json !== 'string') throw new TypeError('Structured data must be serializable.');
  const escapes: Record<string, string> = {
    '<': '\\u003c', '>': '\\u003e', '&': '\\u0026',
    '\u2028': '\\u2028', '\u2029': '\\u2029',
  };
  return json.replace(/[<>&\u2028\u2029]/g, character => escapes[character]);
}
