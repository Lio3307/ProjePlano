const TEXT_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "BLOCKQUOTE", "PRE", "BR"])
const EXPORT_TAGS = new Set([...TEXT_TAGS, "STRONG", "B", "EM", "I", "S", "U", "CODE", "UL", "OL", "HR", "A", "SPAN", "DIV", "LABEL", "INPUT"])

export function getDocumentText(html: string) {
  return getDocumentPlainText(html).replace(/\s+/g, " ")
}

export function getDocumentPlainText(html: string) {
  const body = new DOMParser().parseFromString(html, "text/html").body
  body.querySelectorAll("script, style, template, noscript").forEach(node => node.remove())
  body.querySelectorAll([...TEXT_TAGS].join(",")).forEach(node => node.append("\n"))
  return body.textContent?.replace(/[^\S\n]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim() ?? ""
}

export function matchesDocumentSearch(title: string, text: string, query: string) {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ")
  return title.toLowerCase().includes(normalized) || text.toLowerCase().includes(normalized)
}

export function escapeDocumentText(value: string) {
  return value.replace(/[&<>"']/g, character => {
    switch (character) {
      case "&": return "&amp;"
      case "<": return "&lt;"
      case ">": return "&gt;"
      case '"': return "&quot;"
      default: return "&#39;"
    }
  })
}

export function createDocumentHtml(title: string, html: string) {
  const body = new DOMParser().parseFromString(html, "text/html").body
  function render(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return escapeDocumentText(node.textContent ?? "")
    if (!(node instanceof Element) || !EXPORT_TAGS.has(node.tagName)) return ""
    const tag = node.tagName.toLowerCase()
    if (tag === "input") return node.getAttribute("type") === "checkbox"
      ? `<input type="checkbox" disabled${node.hasAttribute("checked") ? " checked" : ""}>` : ""
    if (tag === "br" || tag === "hr") return `<${tag}>`
    const href = node.getAttribute("href") ?? ""
    const link = tag === "a" && /^(https?:\/\/|mailto:)/i.test(href)
      ? ` href="${escapeDocumentText(href)}" rel="noreferrer"` : ""
    return `<${tag}${link}>${Array.from(node.childNodes, render).join("")}</${tag}>`
  }
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${escapeDocumentText(title)}</title>
<style>body{max-width:48rem;margin:2rem auto;padding:0 1rem;font:16px/1.6 system-ui;overflow-wrap:anywhere}pre{white-space:pre-wrap;background:#f4f4f4;padding:1rem}blockquote{border-left:3px solid #ccc;padding-left:1rem}</style>
</head><body><h1>${escapeDocumentText(title)}</h1>${Array.from(body.childNodes, render).join("")}</body></html>`
}

export function getDocumentFilename(title: string, extension: "html" | "md" = "html") {
  const safeTitle = Array.from(title, character => character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character) ? "-" : character)
    .join("").slice(0, 100).replace(/[. ]+$/g, "")
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(safeTitle)
  return (reserved ? "document-" + safeTitle : safeTitle || "document") + "." + extension
}

export function countDocumentText(text: string) {
  const words = new Intl.Segmenter(undefined, { granularity: "word" })
  const characters = new Intl.Segmenter(undefined, { granularity: "grapheme" })
  return {
    words: Array.from(words.segment(text)).filter(segment => segment.isWordLike).length,
    characters: Array.from(characters.segment(text)).length,
  }
}
