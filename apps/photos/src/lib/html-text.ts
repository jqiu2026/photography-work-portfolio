/** The few tags a pasted message is likely to contain, turned into the plain text the gallery renders (bold, italic, links, lists). */
export function htmlToText(input: string): string {
  if (!/<\w+[^>]*>/.test(input)) return input;
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|div|ul|ol|hr)>/gi, "\n\n")
    .replace(/<hr\s*\/?>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**")
    .replace(/<(i|em)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n- (.*?)(?=\n(?!- )|$)/g, "\n- $1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
