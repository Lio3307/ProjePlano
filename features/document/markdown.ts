function escapeMarkdown(text: string) {
  return text.replace(/&/g, "&amp;").replace(/[\\`*_{}\[\]()<>#+.!|~\-]/g, "\\$&")
}

export function createDocumentMarkdown(title: string, html: string) {
  const body = new DOMParser().parseFromString(html, "text/html").body
  function children(node: Node): string {
    return Array.from(node.childNodes, render).join("")
  }
  function render(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return escapeMarkdown((node.textContent ?? "").replace(/\s+/g, " "))
    if (!(node instanceof Element)) return ""
    const tag = node.tagName
    if (["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT", "IFRAME", "INPUT", "LABEL"].includes(tag)) return ""
    if (tag === "PRE") {
      const text = node.textContent ?? ""
      const fence = "`".repeat(Math.max(3, ...Array.from(text.matchAll(/`+/g), match => match[0].length + 1)))
      return `\n\n${fence}\n${text.replace(/\n$/, "")}\n${fence}\n\n`
    }
    if (tag === "CODE") {
      const text = (node.textContent ?? "").replace(/\n/g, " ")
      const fence = "`".repeat(Math.max(1, ...Array.from(text.matchAll(/`+/g), match => match[0].length + 1)))
      return `${fence} ${text} ${fence}`
    }
    if (tag === "UL" || tag === "OL") {
      const start = Number(node.getAttribute("start") ?? 1)
      const items = Array.from(node.children).filter(item => item.tagName === "LI")
      return "\n\n" + items.map((item, index) => {
        const marker = tag === "OL" ? `${Number.isSafeInteger(start) ? start + index : index + 1}. ` : "- "
        const checkbox = item.getAttribute("data-type") === "taskItem"
          ? `[${item.getAttribute("data-checked") === "true" ? "x" : " "}] ` : ""
        const lines = children(item).trim().split("\n")
        return marker + checkbox + lines.join("\n" + " ".repeat(marker.length))
      }).join("\n") + "\n\n"
    }
    const text = children(node)
    if (/^H[1-6]$/.test(tag)) return `\n\n${"#".repeat(Number(tag[1]))} ${text.trim()}\n\n`
    if (tag === "P" || tag === "DIV") return `\n\n${text}\n\n`
    if (tag === "BR") return "  \n"
    if (tag === "HR") return "\n\n---\n\n"
    if (tag === "BLOCKQUOTE") return "\n\n" + text.trim().split("\n").map(line => "> " + line).join("\n") + "\n\n"
    if (tag === "STRONG" || tag === "B") return `**${text}**`
    if (tag === "EM" || tag === "I") return `*${text}*`
    if (tag === "S" || tag === "DEL") return `~~${text}~~`
    if (tag === "A") {
      const href = node.getAttribute("href") ?? ""
      return /^(https?:\/\/|mailto:)/i.test(href)
        ? `[${text}](<${href.replace(/[<>\s\\]/g, character => encodeURIComponent(character))}>)` : text
    }
    return text
  }
  return `# ${escapeMarkdown(title.replace(/\s+/g, " "))}\n\n${children(body).trim()}\n`
}
