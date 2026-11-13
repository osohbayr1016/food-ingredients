/** Login return paths must stay within this application's origin. */
export function safeLoginDestination(value:unknown,fallback="/profile"):string{
  if(typeof value!=="string" || value.length>1024 || !value.startsWith("/") ||
      value.startsWith("//") || value.includes("\\") ||
      /[\u0000-\u001F\u007F]/.test(value))return fallback;
  // Reject escaped host separators that some navigation layers may reinterpret.
  if(/%2f|%5c|%0[0-9a-f]|%1[0-9a-f]/i.test(value))return fallback;
  return value;
}
