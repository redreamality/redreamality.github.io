const absoluteExternalUrl = /\b(?:https?|wss?|ftp):\/\/[^\s"'`<>{}\\),;]+/gi;
const protocolRelativeUrl = /(?<![:/])\/\/[^\s"'`<>{}\\),;]+/g;

export function findExternalResources(html: string): string[] {
  return [...new Set([
    ...(html.match(absoluteExternalUrl) ?? []),
    ...(html.match(protocolRelativeUrl) ?? []),
  ])];
}

export function assertExternalResourcesAllowed(
  html: string,
  allowlist: string[],
  artifactLabel: string,
): void {
  const blocked = findExternalResources(html).filter((url) => !allowlist.includes(url));
  if (blocked.length > 0) {
    throw new Error(`${artifactLabel} uses external resources outside its allowlist: ${blocked.join(', ')}`);
  }
}
